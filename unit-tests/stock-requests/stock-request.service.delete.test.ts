// Environment setup for push notification dependencies
process.env.VAPID_SUBJECT = "mailto:admin@example.com";
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY =
  "BODfHCuNmOf40o7PBsBT-1nmZCtGO9bPBWNnufOq-7IJyZPBzEDaP0dZu2SDSUTZFpqGmH3z9jJwMv_LExT_2Os";
process.env.VAPID_PRIVATE_KEY = "dlcAeEogpKe7pTE9s5xKU8nlGPaje55UDimXMKog60A";

import auditLogsRepository from "@/features/audit-logs/audit-log.repository";
import { stockRequestRepository } from "@/features/stock-requests/stock-request.repository";
import stockRequestService from "@/features/stock-requests/stock-request.service";
import { badRequest, forbidden } from "@/shared/lib/error-handlers";
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset } from "jest-mock-extended";
import { Session } from "next-auth";

jest.mock("@/features/stock-requests/stock-request.repository");
jest.mock("@/features/audit-logs/audit-log.repository");

const mockedStockRequestRepository = stockRequestRepository as jest.Mocked<
  typeof stockRequestRepository
>;
const mockedAuditLogsRepository = auditLogsRepository as jest.Mocked<
  typeof auditLogsRepository
>;

const managerSession = {
  id: "manager-1",
  name: "Manager Bob",
  role: "HOTEL_MANAGER",
} as Session["user"];

const housekeepingAuthorSession = {
  id: "housekeeper-author",
  name: "Housekeeper Jane",
  role: "HOUSEKEEPING",
} as Session["user"];

const housekeepingOtherSession = {
  id: "housekeeper-other",
  name: "Housekeeper John",
  role: "HOUSEKEEPING",
} as Session["user"];

const accountantSession = {
  id: "accountant-1",
  name: "Accountant Dave",
  role: "ACCOUNTANT",
} as Session["user"];

const prismaMock = mockDeep<PrismaClient>();

describe("stockRequestService.delete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);

    prismaMock.$transaction.mockImplementation(async (callback) =>
      typeof callback === "function" ? callback(prismaMock) : callback,
    );
  });

  const existingStockRequest = {
    id: "sr-1",
    itemId: "item-1",
    requestedQuantity: 5,
    sourceLocationId: "loc-1",
    destinationLocationId: "loc-2",
    type: "ISSUE",
    reason: "Damaged sheet replacement",
    status: "PENDING",
    requestedById: "housekeeper-author",
    approvedById: null,
    decisionNotes: null,
    approvedQuantity: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("successfully deletes stock request and creates a DELETE audit log when requested by HOTEL_MANAGER", async () => {
    mockedStockRequestRepository.findById.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );

    mockedStockRequestRepository.delete.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.delete>
      >,
    );

    mockedAuditLogsRepository.create.mockResolvedValue({
      id: "audit-1",
    } as unknown as Awaited<ReturnType<typeof auditLogsRepository.create>>);

    const result = await stockRequestService.delete(
      managerSession,
      "sr-1",
      prismaMock,
    );

    expect(mockedStockRequestRepository.delete).toHaveBeenCalledWith(
      "sr-1",
      prismaMock,
    );

    expect(mockedAuditLogsRepository.create).toHaveBeenCalledWith(
      {
        entity: "STOCK_REQUEST",
        action: "DELETE",
        entityId: "sr-1",
        metadata: {
          itemId: "item-1",
          quantity: 5,
          sourceLocationId: "loc-1",
          destinationLocationId: "loc-2",
          requestType: "ISSUE",
          reason: "Damaged sheet replacement",
        },
        userId: managerSession.id,
      },
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock request deleted successfully.",
      data: {
        id: "sr-1",
      },
    });
  });

  it("successfully deletes stock request when requested by author with HOUSEKEEPING role", async () => {
    mockedStockRequestRepository.findById.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );

    mockedStockRequestRepository.delete.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.delete>
      >,
    );

    mockedAuditLogsRepository.create.mockResolvedValue({
      id: "audit-1",
    } as unknown as Awaited<ReturnType<typeof auditLogsRepository.create>>);

    const result = await stockRequestService.delete(
      housekeepingAuthorSession,
      "sr-1",
      prismaMock,
    );

    expect(mockedStockRequestRepository.delete).toHaveBeenCalledWith(
      "sr-1",
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock request deleted successfully.",
      data: {
        id: "sr-1",
      },
    });
  });

  it("throws badRequest when stock request does not exist", async () => {
    mockedStockRequestRepository.findById.mockResolvedValue(null);

    await expect(
      stockRequestService.delete(managerSession, "nonexistent-sr", prismaMock),
    ).rejects.toEqual(badRequest("Stock request not found."));

    expect(mockedStockRequestRepository.delete).not.toHaveBeenCalled();
    expect(mockedAuditLogsRepository.create).not.toHaveBeenCalled();
  });

  it("throws forbidden when HOUSEKEEPING user tries to delete another user's request", async () => {
    mockedStockRequestRepository.findById.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );

    await expect(
      stockRequestService.delete(housekeepingOtherSession, "sr-1", prismaMock),
    ).rejects.toEqual(
      forbidden("You are only allowed to delete your own stock requests."),
    );

    expect(mockedStockRequestRepository.delete).not.toHaveBeenCalled();
    expect(mockedAuditLogsRepository.create).not.toHaveBeenCalled();
  });

  it("throws forbidden when user role lacks deletion privileges", async () => {
    mockedStockRequestRepository.findById.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );

    await expect(
      stockRequestService.delete(accountantSession, "sr-1", prismaMock),
    ).rejects.toEqual(
      forbidden("You are not allowed to delete this stock request."),
    );

    expect(mockedStockRequestRepository.delete).not.toHaveBeenCalled();
    expect(mockedAuditLogsRepository.create).not.toHaveBeenCalled();
  });

  it("does not create an audit log if repository delete throws an error", async () => {
    mockedStockRequestRepository.findById.mockResolvedValue(
      existingStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );

    mockedStockRequestRepository.delete.mockRejectedValue(
      new Error("Database delete error"),
    );

    await expect(
      stockRequestService.delete(managerSession, "sr-1", prismaMock),
    ).rejects.toThrow("Database delete error");

    expect(mockedAuditLogsRepository.create).not.toHaveBeenCalled();
  });
});
