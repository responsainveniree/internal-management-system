// Environment setup for push notification dependencies
process.env.VAPID_SUBJECT = "mailto:admin@example.com";
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY =
  "BODfHCuNmOf40o7PBsBT-1nmZCtGO9bPBWNnufOq-7IJyZPBzEDaP0dZu2SDSUTZFpqGmH3z9jJwMv_LExT_2Os";
process.env.VAPID_PRIVATE_KEY = "dlcAeEogpKe7pTE9s5xKU8nlGPaje55UDimXMKog60A";

import auditLogsRepository from "@/features/audit-logs/audit-log.repository";
import itemRepository from "@/features/items/item.repository";
import { locationRepository } from "@/features/locations/location.repository";
import { stockRequestRepository } from "@/features/stock-requests/stock-request.repository";
import stockRequestService from "@/features/stock-requests/stock-request.service";
import { stockRepository } from "@/features/stocks/stock.repository";
import { badRequest } from "@/shared/lib/error-handlers";
import { sendPushToUser } from "@/shared/lib/push";
import { StockRequestCreateSchema } from "@/shared/lib/zods/stock-request.zod";
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset } from "jest-mock-extended";
import { Session } from "next-auth";

// Mocking external dependencies only (do NOT mock stockRequestService)
jest.mock("@/features/stock-requests/stock-request.repository");
jest.mock("@/features/locations/location.repository");
jest.mock("@/features/items/item.repository");
jest.mock("@/features/stocks/stock.repository");
jest.mock("@/features/audit-logs/audit-log.repository");
jest.mock("@/shared/lib/push");

const mockedStockRequestRepository = stockRequestRepository as jest.Mocked<
  typeof stockRequestRepository
>;

const mockedLocationRepository = locationRepository as jest.Mocked<
  typeof locationRepository
>;

const mockedItemRepository = itemRepository as jest.Mocked<
  typeof itemRepository
>;

const mockedStockRepository = stockRepository as jest.Mocked<
  typeof stockRepository
>;

const mockedAuditLogRepository = auditLogsRepository as jest.Mocked<
  typeof auditLogsRepository
>;

const mockedSendPushToUser = sendPushToUser as jest.MockedFunction<
  typeof sendPushToUser
>;

// Test mock fixtures
const housekeepingFakeSession = {
  name: "Housekeeper John",
  id: "user-2",
  role: "HOUSEKEEPING",
} as Session["user"];

const prismaMock = mockDeep<PrismaClient>();

describe("stockRequestService.create", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);

    // Mock Prisma transaction execution to execute callback directly
    prismaMock.$transaction.mockImplementation(async (callback) =>
      typeof callback === "function" ? callback(prismaMock) : callback,
    );
  });

  const payload: StockRequestCreateSchema = {
    itemId: "itemId-1",
    destinationLocationId: "loc-2",
    stockId: "stock-1",
    quantity: 10,
    reason: "Restocking housekeeping cart",
    requestType: "ISSUE",
  };

  it("should successfully create a stock request, record an audit log, and send push notifications", async () => {
    // 1. Setup repository mock responses
    mockedItemRepository.findById.mockResolvedValue({
      id: "itemId-1",
      name: "Towel",
    } as unknown as Awaited<ReturnType<typeof itemRepository.findById>>);

    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 100,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);

    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
      name: "Floor 2 Locker",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);

    mockedStockRequestRepository.create.mockResolvedValue({
      id: "stock-request-1",
      itemId: "itemId-1",
      requestedQuantity: 10,
      sourceLocationId: "loc-1",
      destinationLocationId: "loc-2",
      type: "ISSUE",
      reason: "mock request stock",
    } as unknown as Awaited<ReturnType<typeof stockRequestRepository.create>>);

    mockedAuditLogRepository.create.mockResolvedValue({
      id: "audit-1",
    } as unknown as Awaited<ReturnType<typeof auditLogsRepository.create>>);
    mockedSendPushToUser.mockResolvedValue();

    // 2. Execute the service method under test
    const result = await stockRequestService.create(
      housekeepingFakeSession,
      payload,
      prismaMock,
    );

    // 3. Verify audit log creation
    expect(mockedAuditLogRepository.create).toHaveBeenCalledWith(
      {
        entity: "STOCK_REQUEST",
        action: "CREATE",
        entityId: "stock-request-1",
        metadata: {
          itemId: "itemId-1",
          quantity: 10,
          sourceLocationId: "loc-1",
          destinationLocationId: "loc-2",
          requestType: "ISSUE",
          reason: "mock request stock",
        },
        userId: housekeepingFakeSession.id,
      },
      prismaMock,
    );

    // 4. Verify notification targeting managers
    expect(mockedSendPushToUser).toHaveBeenCalledWith(
      null,
      ["HOTEL_MANAGER", "SUPERVISOR"],
      {
        title: "New Stock Request",
        body: `${housekeepingFakeSession.name} has submitted a new stock request.`,
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/stock-requests`,
      },
    );

    // 5. Verify final service output
    expect(result).toEqual({
      message: "Stock request created successfully",
      data: {
        id: "stock-request-1",
      },
    });
  });

  it("throws badRequest when item does not exist", async () => {
    mockedItemRepository.findById.mockResolvedValue(null);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);
    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 100,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.create(housekeepingFakeSession, payload, prismaMock),
    ).rejects.toEqual(badRequest("Item not found"));

    expect(mockedStockRequestRepository.create).not.toHaveBeenCalled();
    expect(mockedAuditLogRepository.create).not.toHaveBeenCalled();
    expect(mockedSendPushToUser).not.toHaveBeenCalled();
  });

  it("throws badRequest when stock does not exist", async () => {
    mockedItemRepository.findById.mockResolvedValue({
      id: "itemId-1",
      name: "Towel",
    } as unknown as Awaited<ReturnType<typeof itemRepository.findById>>);
    mockedStockRepository.findById.mockResolvedValue(null);
    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 100,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.create(housekeepingFakeSession, payload, prismaMock),
    ).rejects.toEqual(badRequest("Stock not found"));

    expect(mockedStockRequestRepository.create).not.toHaveBeenCalled();
    expect(mockedAuditLogRepository.create).not.toHaveBeenCalled();
  });

  it("throws badRequest when destination location does not exist", async () => {
    mockedItemRepository.findById.mockResolvedValue({
      id: "itemId-1",
      name: "Towel",
    } as unknown as Awaited<ReturnType<typeof itemRepository.findById>>);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);
    mockedLocationRepository.findById.mockResolvedValue(null);
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 100,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.create(housekeepingFakeSession, payload, prismaMock),
    ).rejects.toEqual(badRequest("Destination location not found"));

    expect(mockedStockRequestRepository.create).not.toHaveBeenCalled();
  });

  it("throws badRequest when total ready stock is undefined or null", async () => {
    mockedItemRepository.findById.mockResolvedValue({
      id: "itemId-1",
      name: "Towel",
    } as unknown as Awaited<ReturnType<typeof itemRepository.findById>>);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);
    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: null,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.create(housekeepingFakeSession, payload, prismaMock),
    ).rejects.toEqual(badRequest("Unable to determine the total ready stock."));

    expect(mockedStockRequestRepository.create).not.toHaveBeenCalled();
  });

  it("throws badRequest when requested quantity exceeds available stock", async () => {
    mockedItemRepository.findById.mockResolvedValue({
      id: "itemId-1",
      name: "Towel",
    } as unknown as Awaited<ReturnType<typeof itemRepository.findById>>);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);
    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 5, // less than payload quantity 10
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.create(housekeepingFakeSession, payload, prismaMock),
    ).rejects.toEqual(
      badRequest("Requested quantity exceeds the available stock."),
    );

    expect(mockedStockRequestRepository.create).not.toHaveBeenCalled();
  });

  it("does not send push notification if repository creation fails", async () => {
    mockedItemRepository.findById.mockResolvedValue({
      id: "itemId-1",
      name: "Towel",
    } as unknown as Awaited<ReturnType<typeof itemRepository.findById>>);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);
    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 100,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    mockedStockRequestRepository.create.mockRejectedValue(
      new Error("Database create error"),
    );

    await expect(
      stockRequestService.create(housekeepingFakeSession, payload, prismaMock),
    ).rejects.toThrow("Database create error");

    expect(mockedSendPushToUser).not.toHaveBeenCalled();
  });
});
