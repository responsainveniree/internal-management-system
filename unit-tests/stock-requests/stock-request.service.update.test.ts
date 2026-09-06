// Environment setup for push notification dependencies
process.env.VAPID_SUBJECT = "mailto:admin@example.com";
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY =
  "BODfHCuNmOf40o7PBsBT-1nmZCtGO9bPBWNnufOq-7IJyZPBzEDaP0dZu2SDSUTZFpqGmH3z9jJwMv_LExT_2Os";
process.env.VAPID_PRIVATE_KEY = "dlcAeEogpKe7pTE9s5xKU8nlGPaje55UDimXMKog60A";

import auditLogsRepository from "@/features/audit-logs/audit-log.repository";
import { locationRepository } from "@/features/locations/location.repository";
import { stockRequestRepository } from "@/features/stock-requests/stock-request.repository";
import stockRequestService from "@/features/stock-requests/stock-request.service";
import { stockRepository } from "@/features/stocks/stock.repository";
import { badRequest, notFound } from "@/shared/lib/error-handlers";
import { StockRequestUpdateSchema } from "@/shared/lib/zods/stock-request.zod";
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset } from "jest-mock-extended";
import { Session } from "next-auth";

jest.mock("@/features/stock-requests/stock-request.repository");
jest.mock("@/features/locations/location.repository");
jest.mock("@/features/stocks/stock.repository");
jest.mock("@/features/audit-logs/audit-log.repository");

const mockedStockRequestRepository = stockRequestRepository as jest.Mocked<
  typeof stockRequestRepository
>;
const mockedLocationRepository = locationRepository as jest.Mocked<
  typeof locationRepository
>;
const mockedStockRepository = stockRepository as jest.Mocked<
  typeof stockRepository
>;
const mockedAuditLogsRepository = auditLogsRepository as jest.Mocked<
  typeof auditLogsRepository
>;

const fakeSession = {
  id: "user-1",
  name: "Jane Staff",
  role: "HOUSEKEEPING",
} as Session["user"];

const prismaMock = mockDeep<PrismaClient>();

describe("stockRequestService.update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);

    prismaMock.$transaction.mockImplementation(async (callback) =>
      typeof callback === "function" ? callback(prismaMock) : callback,
    );
  });

  const validPayload: StockRequestUpdateSchema = {
    type: "ISSUE",
    requestedQuantity: 5,
    stockId: "stock-1",
    destinationLocationId: "loc-2",
  };

  const existingStockRequest = {
    id: "sr-1",
    itemId: "item-1",
    requestedQuantity: 3,
    sourceLocationId: "loc-1",
    destinationLocationId: "loc-3",
    type: "ISSUE",
    reason: "Linen restocking",
    status: "PENDING",
    requestedById: "user-1",
    approvedById: null,
    decisionNotes: null,
    approvedQuantity: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const updatedStockRequest = {
    id: "sr-1",
    itemId: "item-1",
    requestedQuantity: 5,
    sourceLocationId: "loc-1",
    destinationLocationId: "loc-2",
    type: "ISSUE",
    reason: "Linen restocking",
    status: "PENDING",
    requestedById: "user-1",
    approvedById: null,
    decisionNotes: null,
    approvedQuantity: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("successfully updates stock request and records an UPDATE audit log", async () => {
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);

    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
      name: "Floor 2 Linen Room",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);

    mockedStockRequestRepository.findById.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );

    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 10,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    mockedStockRequestRepository.update.mockResolvedValue(
      updatedStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.update>
      >,
    );

    mockedAuditLogsRepository.create.mockResolvedValue({
      id: "audit-1",
    } as unknown as Awaited<ReturnType<typeof auditLogsRepository.create>>);

    const result = await stockRequestService.update(
      fakeSession,
      "sr-1",
      validPayload,
      prismaMock,
    );

    expect(mockedStockRequestRepository.update).toHaveBeenCalledWith(
      "sr-1",
      validPayload,
      prismaMock,
    );

    expect(mockedAuditLogsRepository.create).toHaveBeenCalledWith(
      {
        entity: "STOCK_REQUEST",
        action: "UPDATE",
        entityId: "sr-1",
        metadata: {
          stockRequestId: "sr-1",
          quantity: 5,
          sourceLocationId: "loc-1",
          destinationLocationId: "loc-2",
          requestType: "ISSUE",
          reason: "Linen restocking",
        },
        userId: fakeSession.id,
      },
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock request updated successfully",
      stockRequestId: "sr-1",
    });
  });

  it("skips stock lookup when data.stockId is not provided", async () => {
    const payloadWithoutStockId: StockRequestUpdateSchema = {
      type: "RESTOCK",
      requestedQuantity: 5,
      destinationLocationId: "loc-2",
    };

    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
      name: "Floor 2 Linen Room",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);

    mockedStockRequestRepository.findById.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );

    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 10,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    mockedStockRequestRepository.update.mockResolvedValue(
      updatedStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.update>
      >,
    );

    await stockRequestService.update(
      fakeSession,
      "sr-1",
      payloadWithoutStockId,
      prismaMock,
    );

    expect(mockedStockRepository.findById).not.toHaveBeenCalled();
    expect(mockedStockRequestRepository.update).toHaveBeenCalledWith(
      "sr-1",
      payloadWithoutStockId,
      prismaMock,
    );
  });

  it("throws notFound when stockId is provided but stock does not exist", async () => {
    mockedStockRepository.findById.mockResolvedValue(null);
    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);
    mockedStockRequestRepository.findById.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 10,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.update(fakeSession, "sr-1", validPayload, prismaMock),
    ).rejects.toEqual(notFound("stock not found"));

    expect(mockedStockRequestRepository.update).not.toHaveBeenCalled();
    expect(mockedAuditLogsRepository.create).not.toHaveBeenCalled();
  });

  it("throws notFound when destination location does not exist", async () => {
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);
    mockedLocationRepository.findById.mockResolvedValue(null);
    mockedStockRequestRepository.findById.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 10,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.update(fakeSession, "sr-1", validPayload, prismaMock),
    ).rejects.toEqual(notFound("Destination location not found"));

    expect(mockedStockRequestRepository.update).not.toHaveBeenCalled();
  });

  it("throws notFound when stock request does not exist", async () => {
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);
    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);
    mockedStockRequestRepository.findById.mockResolvedValue(null);
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 10,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.update(
        fakeSession,
        "nonexistent-sr",
        validPayload,
        prismaMock,
      ),
    ).rejects.toEqual(notFound("Stock request not found"));

    expect(mockedStockRequestRepository.update).not.toHaveBeenCalled();
  });

  it("throws badRequest when stock request has already been reviewed", async () => {
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);
    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);
    mockedStockRequestRepository.findById.mockResolvedValue({
      ...existingStockRequest,
      status: "APPROVED",
    } as unknown as Awaited<
      ReturnType<typeof stockRequestRepository.findById>
    >);
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 10,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.update(fakeSession, "sr-1", validPayload, prismaMock),
    ).rejects.toEqual(
      badRequest("Can't update a stock request that has been reviewed"),
    );

    expect(mockedStockRequestRepository.update).not.toHaveBeenCalled();
  });

  it("throws badRequest when source location and destination location are the same", async () => {
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-2", // same as destinationLocationId
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);
    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);
    mockedStockRequestRepository.findById.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 10,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.update(fakeSession, "sr-1", validPayload, prismaMock),
    ).rejects.toEqual(
      badRequest("Source location and destination location can't be same"),
    );

    expect(mockedStockRequestRepository.update).not.toHaveBeenCalled();
  });

  it("throws notFound when totalActiveReadyStock is null", async () => {
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);
    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);
    mockedStockRequestRepository.findById.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: null,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.update(fakeSession, "sr-1", validPayload, prismaMock),
    ).rejects.toEqual(notFound("Stock record not found."));

    expect(mockedStockRequestRepository.update).not.toHaveBeenCalled();
  });

  it("throws badRequest when requested quantity exceeds available stock", async () => {
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);
    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);
    mockedStockRequestRepository.findById.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 4, // less than requested 5
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.update(fakeSession, "sr-1", validPayload, prismaMock),
    ).rejects.toEqual(
      badRequest(
        "Requested quantity cannot exceed the total ready stock quantity.",
      ),
    );

    expect(mockedStockRequestRepository.update).not.toHaveBeenCalled();
  });

  it("does not create an audit log if repository update fails", async () => {
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findById>>);
    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
    } as unknown as Awaited<ReturnType<typeof locationRepository.findById>>);
    mockedStockRequestRepository.findById.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 10,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    mockedStockRequestRepository.update.mockRejectedValue(
      new Error("Database update error"),
    );

    await expect(
      stockRequestService.update(fakeSession, "sr-1", validPayload, prismaMock),
    ).rejects.toThrow("Database update error");

    expect(mockedAuditLogsRepository.create).not.toHaveBeenCalled();
  });
});
