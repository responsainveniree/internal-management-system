// Environment setup for push notification dependencies
process.env.VAPID_SUBJECT = "mailto:admin@example.com";
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY =
  "BODfHCuNmOf40o7PBsBT-1nmZCtGO9bPBWNnufOq-7IJyZPBzEDaP0dZu2SDSUTZFpqGmH3z9jJwMv_LExT_2Os";
process.env.VAPID_PRIVATE_KEY = "dlcAeEogpKe7pTE9s5xKU8nlGPaje55UDimXMKog60A";
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

import auditLogsRepository from "@/features/audit-logs/audit-log.repository";
import stockMovementsService from "@/features/stock-movements/stock-movements.service";
import { stockRequestRepository } from "@/features/stock-requests/stock-request.repository";
import stockRequestService from "@/features/stock-requests/stock-request.service";
import { stockRepository } from "@/features/stocks/stock.repository";
import { badRequest, notFound } from "@/shared/lib/error-handlers";
import { sendPushToUser } from "@/shared/lib/push";
import { StockRequestReviewSchema } from "@/shared/lib/zods/stock-request.zod";
import { MovementType, PrismaClient, StockRequestType } from "@prisma/client";
import { mockDeep, mockReset } from "jest-mock-extended";
import { Session } from "next-auth";

jest.mock("@/features/stock-requests/stock-request.repository");
jest.mock("@/features/stocks/stock.repository");
jest.mock("@/features/stock-movements/stock-movements.service");
jest.mock("@/features/audit-logs/audit-log.repository");
jest.mock("@/shared/lib/push");

const mockedStockRequestRepository = stockRequestRepository as jest.Mocked<
  typeof stockRequestRepository
>;
const mockedStockRepository = stockRepository as jest.Mocked<
  typeof stockRepository
>;
const mockedStockMovementsService = stockMovementsService as jest.Mocked<
  typeof stockMovementsService
>;
const mockedAuditLogsRepository = auditLogsRepository as jest.Mocked<
  typeof auditLogsRepository
>;
const mockedSendPushToUser = sendPushToUser as jest.MockedFunction<
  typeof sendPushToUser
>;

const fakeManagerSession = {
  id: "manager-1",
  name: "Manager Bob",
  role: "HOTEL_MANAGER",
} as Session["user"];

const prismaMock = mockDeep<PrismaClient>();

describe("stockRequestService.review", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);

    prismaMock.$transaction.mockImplementation(async (callback) =>
      typeof callback === "function" ? callback(prismaMock) : callback,
    );
  });

  const baseReviewData: StockRequestReviewSchema = {
    stockRequestStatus: "APPROVED",
    stockRequestType: "ISSUE",
    approvedQuantity: 5,
    decisitonNotes: "Approved by manager",
    stockMovementReason: "Restock housekeeping supplies",
  };

  const baseStockRequest = {
    id: "sr-1",
    itemId: "item-1",
    requestedQuantity: 5,
    sourceLocationId: "loc-1",
    destinationLocationId: "loc-2",
    type: "ISSUE" as StockRequestType,
    reason: "Need extra towels",
    status: "PENDING",
    requestedById: "user-requester-1",
    approvedById: null,
    decisionNotes: null,
    approvedQuantity: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const baseReviewedStockRequest = {
    ...baseStockRequest,
    status: "APPROVED",
    approvedById: fakeManagerSession.id,
    decisionNotes: "Approved by manager",
    approvedQuantity: 5,
  };

  it("successfully reviews an ISSUE request: maps to CONSUME, sends push, writes audit log, and returns response", async () => {
    mockedStockRequestRepository.findById.mockResolvedValue(
      baseStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );

    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 20,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    mockedStockRequestRepository.review.mockResolvedValue(
      baseReviewedStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.review>
      >,
    );

    mockedStockRepository.findFirst.mockResolvedValue({
      id: "stock-loc-1",
      itemId: "item-1",
      locationId: "loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findFirst>>);

    mockedStockMovementsService.create.mockResolvedValue({
      message: "Stock movement created successfully",
      stockMovementId: "sm-1",
      stockmovementType: "CONSUME",
      stockId: "stock-loc-1",
      itemId: "item-1",
    });

    mockedAuditLogsRepository.create.mockResolvedValue({
      id: "audit-1",
    } as unknown as Awaited<ReturnType<typeof auditLogsRepository.create>>);

    const result = await stockRequestService.review(
      fakeManagerSession,
      "sr-1",
      baseReviewData,
      prismaMock,
    );

    expect(mockedStockRequestRepository.review).toHaveBeenCalledWith(
      fakeManagerSession.id,
      "sr-1",
      baseReviewData,
      prismaMock,
    );

    expect(mockedStockRepository.findFirst).toHaveBeenCalledWith(
      {
        itemId: "item-1",
        locationId: "loc-1",
      },
      prismaMock,
    );

    expect(mockedStockMovementsService.create).toHaveBeenCalledWith(
      fakeManagerSession,
      {
        itemId: "item-1",
        quantity: 5,
        reason: "Restock housekeeping supplies",
        stockMovementType: "CONSUME",
        destinationLocationId: "loc-2",
        stockId: "stock-loc-1",
        isGlobalStock: false,
      },
      prismaMock,
    );

    expect(mockedSendPushToUser).toHaveBeenCalledWith(
      "user-requester-1",
      null,
      {
        title: "Stock Request Reviewed",
        body: "Your stock request has been approved.",
        url: "http://localhost:3000",
      },
    );

    expect(mockedAuditLogsRepository.create).toHaveBeenCalledWith(
      {
        entity: "STOCK_REQUEST",
        action: "CREATE",
        entityId: "sr-1",
        metadata: {
          itemId: "item-1",
          quantity: 5,
          sourceLocationId: "loc-1",
          destinationLocationId: "loc-2",
          requestType: "ISSUE",
          reason: "Need extra towels",
        },
        userId: fakeManagerSession.id,
      },
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock request reviewed successfully",
      stockRequestId: "sr-1",
    });
  });

  it.each([
    {
      requestType: "RESTOCK" as const,
      expectedMovement: "RECEIVE" as MovementType,
    },
    { requestType: "SALE" as const, expectedMovement: "SALE" as MovementType },
    {
      requestType: "TRANSFER" as const,
      expectedMovement: "TRANSFER" as MovementType,
    },
    {
      requestType: "REPORT_LOST" as const,
      expectedMovement: "MARK_AS_LOST" as MovementType,
    },
    {
      requestType: "LAUNDRY_IN" as const,
      expectedMovement: "LAUNDRY_IN" as MovementType,
    },
    {
      requestType: "LAUNDRY_OUT" as const,
      expectedMovement: "LAUNDRY_OUT" as MovementType,
    },
  ])(
    "maps request type $requestType to movement type $expectedMovement",
    async ({ requestType, expectedMovement }) => {
      const stockRequest = {
        ...baseStockRequest,
        type: requestType,
      };

      const reviewData: StockRequestReviewSchema = {
        ...baseReviewData,
        stockRequestType: requestType,
      };

      mockedStockRequestRepository.findById.mockResolvedValue(
        stockRequest as unknown as Awaited<
          ReturnType<typeof stockRequestRepository.findById>
        >,
      );
      mockedStockRepository.aggregate.mockResolvedValue({
        quantity: 20,
      } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);
      mockedStockRequestRepository.review.mockResolvedValue({
        ...baseReviewedStockRequest,
        type: requestType,
      } as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.review>
      >);
      mockedStockRepository.findFirst.mockResolvedValue({
        id: "stock-loc-1",
      } as unknown as Awaited<ReturnType<typeof stockRepository.findFirst>>);
      mockedStockMovementsService.create.mockResolvedValue({
        message: "Created",
        stockMovementId: "sm-1",
        stockmovementType: expectedMovement,
        stockId: "stock-loc-1",
        itemId: "item-1",
      });
      mockedAuditLogsRepository.create.mockResolvedValue({
        id: "audit-1",
      } as unknown as Awaited<ReturnType<typeof auditLogsRepository.create>>);

      await stockRequestService.review(
        fakeManagerSession,
        "sr-1",
        reviewData,
        prismaMock,
      );

      expect(mockedStockMovementsService.create).toHaveBeenCalledWith(
        fakeManagerSession,
        expect.objectContaining({
          stockMovementType: expectedMovement,
        }),
        prismaMock,
      );
    },
  );

  it("maps WRITE_OFF to writeOffTypeDecision movement type", async () => {
    const stockRequest = {
      ...baseStockRequest,
      type: "WRITE_OFF" as StockRequestType,
    };

    const reviewData: StockRequestReviewSchema = {
      ...baseReviewData,
      stockRequestType: "WRITE_OFF",
      writeOffTypeDecision: "DISCARD",
    };

    mockedStockRequestRepository.findById.mockResolvedValue(
      stockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 20,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    mockedStockRequestRepository.review.mockResolvedValue({
      ...baseReviewedStockRequest,
      type: "WRITE_OFF",
    } as unknown as Awaited<ReturnType<typeof stockRequestRepository.review>>);

    mockedStockRepository.findFirst.mockResolvedValue({
      id: "stock-loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findFirst>>);

    mockedStockMovementsService.create.mockResolvedValue({
      message: "Created",
      stockMovementId: "sm-1",
      stockmovementType: "DISCARD",
      stockId: "stock-loc-1",
      itemId: "item-1",
    });
    mockedAuditLogsRepository.create.mockResolvedValue({
      id: "audit-1",
    } as unknown as Awaited<ReturnType<typeof auditLogsRepository.create>>);

    await stockRequestService.review(
      fakeManagerSession,
      "sr-1",
      reviewData,
      prismaMock,
    );

    expect(mockedStockMovementsService.create).toHaveBeenCalledWith(
      fakeManagerSession,
      expect.objectContaining({
        stockMovementType: "DISCARD",
      }),
      prismaMock,
    );
  });

  it("uses destinationLocationId when sourceLocationId is null and sets isGlobalStock to true", async () => {
    const globalStockRequest = {
      ...baseStockRequest,
      sourceLocationId: null,
      destinationLocationId: "loc-dest",
    };

    mockedStockRequestRepository.findById.mockResolvedValue(
      globalStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 20,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);
    mockedStockRequestRepository.review.mockResolvedValue({
      ...baseReviewedStockRequest,
      sourceLocationId: null,
      destinationLocationId: "loc-dest",
    } as unknown as Awaited<ReturnType<typeof stockRequestRepository.review>>);
    mockedStockRepository.findFirst.mockResolvedValue({
      id: "stock-dest",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findFirst>>);
    mockedStockMovementsService.create.mockResolvedValue({
      message: "Created",
      stockMovementId: "sm-1",
      stockmovementType: "CONSUME",
      stockId: "stock-dest",
      itemId: "item-1",
    });
    mockedAuditLogsRepository.create.mockResolvedValue({
      id: "audit-1",
    } as unknown as Awaited<ReturnType<typeof auditLogsRepository.create>>);

    await stockRequestService.review(
      fakeManagerSession,
      "sr-1",
      baseReviewData,
      prismaMock,
    );

    expect(mockedStockRepository.findFirst).toHaveBeenCalledWith(
      {
        itemId: "item-1",
        locationId: "loc-dest",
      },
      prismaMock,
    );

    expect(mockedStockMovementsService.create).toHaveBeenCalledWith(
      fakeManagerSession,
      expect.objectContaining({
        isGlobalStock: true,
      }),
      prismaMock,
    );
  });

  it("throws badRequest when stock request type is unrecognized", async () => {
    const invalidTypeRequest = {
      ...baseStockRequest,
      type: "INVALID_TYPE" as unknown as StockRequestType,
    };

    const invalidReviewData = {
      ...baseReviewData,
      stockRequestType: "INVALID_TYPE" as unknown as StockRequestType,
    };

    mockedStockRequestRepository.findById.mockResolvedValue(
      invalidTypeRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 20,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);
    mockedStockRequestRepository.review.mockResolvedValue(
      baseReviewedStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.review>
      >,
    );

    await expect(
      stockRequestService.review(
        fakeManagerSession,
        "sr-1",
        invalidReviewData,
        prismaMock,
      ),
    ).rejects.toEqual(badRequest("Invalid stock request type"));

    expect(mockedStockMovementsService.create).not.toHaveBeenCalled();
  });

  it("throws notFound when stock request is not found", async () => {
    mockedStockRequestRepository.findById.mockResolvedValue(null);
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 20,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.review(
        fakeManagerSession,
        "nonexistent-sr",
        baseReviewData,
        prismaMock,
      ),
    ).rejects.toEqual(notFound("Stock request not found"));

    expect(mockedStockRequestRepository.review).not.toHaveBeenCalled();
    expect(mockedStockMovementsService.create).not.toHaveBeenCalled();
  });

  it("throws badRequest when stock request has already been reviewed", async () => {
    mockedStockRequestRepository.findById.mockResolvedValue({
      ...baseStockRequest,
      status: "APPROVED",
    } as unknown as Awaited<
      ReturnType<typeof stockRequestRepository.findById>
    >);
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 20,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.review(
        fakeManagerSession,
        "sr-1",
        baseReviewData,
        prismaMock,
      ),
    ).rejects.toEqual(
      badRequest("This stock request has already been reviewed."),
    );

    expect(mockedStockRequestRepository.review).not.toHaveBeenCalled();
    expect(mockedStockMovementsService.create).not.toHaveBeenCalled();
  });

  it("throws badRequest when stock request type mismatches review data type", async () => {
    mockedStockRequestRepository.findById.mockResolvedValue({
      ...baseStockRequest,
      type: "RESTOCK",
    } as unknown as Awaited<
      ReturnType<typeof stockRequestRepository.findById>
    >);
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 20,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.review(
        fakeManagerSession,
        "sr-1",
        baseReviewData, // type is ISSUE
        prismaMock,
      ),
    ).rejects.toEqual(badRequest("Stock request type mismatch"));

    expect(mockedStockRequestRepository.review).not.toHaveBeenCalled();
  });

  it("throws notFound when ready stock record is missing", async () => {
    mockedStockRequestRepository.findById.mockResolvedValue(
      baseStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: null,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.review(
        fakeManagerSession,
        "sr-1",
        baseReviewData,
        prismaMock,
      ),
    ).rejects.toEqual(notFound("Stock record not found."));

    expect(mockedStockRequestRepository.review).not.toHaveBeenCalled();
  });

  it("throws badRequest when approved quantity exceeds total ready stock quantity", async () => {
    mockedStockRequestRepository.findById.mockResolvedValue(
      baseStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 4, // less than approvedQuantity (5)
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);

    await expect(
      stockRequestService.review(
        fakeManagerSession,
        "sr-1",
        baseReviewData,
        prismaMock,
      ),
    ).rejects.toEqual(
      badRequest(
        "Approved quantity cannot exceed the total ready stock quantity.",
      ),
    );

    expect(mockedStockRequestRepository.review).not.toHaveBeenCalled();
  });

  it("does not send push notification or write audit log if stock movement creation fails", async () => {
    mockedStockRequestRepository.findById.mockResolvedValue(
      baseStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.findById>
      >,
    );
    mockedStockRepository.aggregate.mockResolvedValue({
      quantity: 20,
    } as unknown as Awaited<ReturnType<typeof stockRepository.aggregate>>);
    mockedStockRequestRepository.review.mockResolvedValue(
      baseReviewedStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.review>
      >,
    );
    mockedStockRepository.findFirst.mockResolvedValue({
      id: "stock-loc-1",
    } as unknown as Awaited<ReturnType<typeof stockRepository.findFirst>>);
    mockedStockMovementsService.create.mockRejectedValue(
      new Error("Movement creation failed"),
    );

    await expect(
      stockRequestService.review(
        fakeManagerSession,
        "sr-1",
        baseReviewData,
        prismaMock,
      ),
    ).rejects.toThrow("Movement creation failed");

    expect(mockedSendPushToUser).not.toHaveBeenCalled();
    expect(mockedAuditLogsRepository.create).not.toHaveBeenCalled();
  });
});
