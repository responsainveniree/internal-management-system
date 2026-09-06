// Environment setup for push notification dependencies
process.env.VAPID_SUBJECT = "mailto:admin@example.com";
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY =
  "BODfHCuNmOf40o7PBsBT-1nmZCtGO9bPBWNnufOq-7IJyZPBzEDaP0dZu2SDSUTZFpqGmH3z9jJwMv_LExT_2Os";
process.env.VAPID_PRIVATE_KEY = "dlcAeEogpKe7pTE9s5xKU8nlGPaje55UDimXMKog60A";

import { stockRequestRepository } from "@/features/stock-requests/stock-request.repository";
import stockRequestService from "@/features/stock-requests/stock-request.service";
import { notFound } from "@/shared/lib/error-handlers";
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset } from "jest-mock-extended";
import { Session } from "next-auth";

jest.mock("@/features/stock-requests/stock-request.repository", () => {
  const actual = jest.requireActual(
    "@/features/stock-requests/stock-request.repository",
  );
  return {
    ...actual,
    stockRequestRepository: {
      getById: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      review: jest.fn(),
      getMany: jest.fn(),
      delete: jest.fn(),
      countRows: jest.fn(),
    },
  };
});

const mockedStockRequestRepository = stockRequestRepository as jest.Mocked<
  typeof stockRequestRepository
>;

const fakeSession = {
  id: "user-1",
  name: "Housekeeper Jane",
  role: "HOUSEKEEPING",
} as Session["user"];

const prismaMock = mockDeep<PrismaClient>();

describe("stockRequestService.getById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
  });

  const mockStockRequest = {
    id: "sr-1",
    requestedQuantity: 10,
    approvedQuantity: 10,
    type: "ISSUE",
    status: "APPROVED",
    decisionNotes: "Approved for housekeeping",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
    item: { id: "item-1", name: "Towel" },
    sourceLocation: { id: "loc-1", name: "Warehouse" },
    destinationLocation: { id: "loc-2", name: "Floor 2" },
    requestedBy: { id: "user-1", name: "User One" },
    approvedBy: { id: "user-2", name: "User Two" },
  };

  it("retrieves stock request successfully when it exists", async () => {
    mockedStockRequestRepository.getById.mockResolvedValue(
      mockStockRequest as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.getById>
      >,
    );

    const result = await stockRequestService.getById(
      fakeSession,
      "sr-1",
      prismaMock,
    );

    expect(mockedStockRequestRepository.getById).toHaveBeenCalledWith(
      "sr-1",
      expect.objectContaining({
        type: true,
        status: true,
        item: { select: { id: true, name: true } },
      }),
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock request retrieved successfully",
      stockRequest: mockStockRequest,
    });
  });

  it("throws notFound when stock request does not exist", async () => {
    mockedStockRequestRepository.getById.mockResolvedValue(null);

    await expect(
      stockRequestService.getById(fakeSession, "nonexistent-sr", prismaMock),
    ).rejects.toEqual(notFound("Stock request not found"));

    expect(mockedStockRequestRepository.getById).toHaveBeenCalledWith(
      "nonexistent-sr",
      expect.anything(),
      prismaMock,
    );
  });
});
