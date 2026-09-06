// Environment setup for push notification dependencies
process.env.VAPID_SUBJECT = "mailto:admin@example.com";
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY =
  "BODfHCuNmOf40o7PBsBT-1nmZCtGO9bPBWNnufOq-7IJyZPBzEDaP0dZu2SDSUTZFpqGmH3z9jJwMv_LExT_2Os";
process.env.VAPID_PRIVATE_KEY = "dlcAeEogpKe7pTE9s5xKU8nlGPaje55UDimXMKog60A";

import { stockRequestRepository } from "@/features/stock-requests/stock-request.repository";
import stockRequestService from "@/features/stock-requests/stock-request.service";
import { StockRequestFilterSchema } from "@/shared/lib/zods/stock-request.zod";
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
      getMany: jest.fn(),
      countRows: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      review: jest.fn(),
      delete: jest.fn(),
    },
  };
});

const mockedStockRequestRepository = stockRequestRepository as jest.Mocked<
  typeof stockRequestRepository
>;

const managerSession = {
  id: "manager-1",
  name: "Manager Bob",
  role: "HOTEL_MANAGER",
} as Session["user"];

const housekeepingSession = {
  id: "housekeeper-1",
  name: "Housekeeper Jane",
  role: "HOUSEKEEPING",
} as Session["user"];

const prismaMock = mockDeep<PrismaClient>();

describe("stockRequestService.getMany", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
  });

  const baseFilters: StockRequestFilterSchema = {
    page: 1,
    dataPerPage: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  };

  const mockStockRequests = [
    {
      id: "sr-1",
      requestedQuantity: 5,
      approvedQuantity: 5,
      type: "ISSUE",
      status: "APPROVED",
      decisionNotes: "Approved",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
      item: { id: "item-1", name: "Towel" },
      sourceLocation: { id: "loc-1", name: "Main Warehouse" },
      destinationLocation: { id: "loc-2", name: "Floor 1 Storage" },
      requestedBy: { id: "user-1", name: "User One" },
      approvedBy: { id: "user-2", name: "User Two" },
    },
  ];

  it("returns paginated stock requests and totalStockRequests count", async () => {
    mockedStockRequestRepository.getMany.mockResolvedValue(
      mockStockRequests as unknown as Awaited<
        ReturnType<typeof stockRequestRepository.getMany>
      >,
    );
    mockedStockRequestRepository.countRows.mockResolvedValue(1);

    const result = await stockRequestService.getMany(
      managerSession,
      baseFilters,
      prismaMock,
    );

    expect(mockedStockRequestRepository.getMany).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        type: true,
        status: true,
      }),
      { createdAt: "desc" },
      0, // skip
      10, // take
      prismaMock,
    );
    expect(mockedStockRequestRepository.countRows).toHaveBeenCalledWith(
      {},
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock requests successfully retrieved",
      data: {
        stockRequests: mockStockRequests,
        totalStockRequests: 1,
      },
    });
  });

  it("calculates skip and take correctly for subsequent pages", async () => {
    mockedStockRequestRepository.getMany.mockResolvedValue([]);
    mockedStockRequestRepository.countRows.mockResolvedValue(25);

    const page2Filters: StockRequestFilterSchema = {
      ...baseFilters,
      page: 3,
      dataPerPage: 10,
    };

    await stockRequestService.getMany(managerSession, page2Filters, prismaMock);

    expect(mockedStockRequestRepository.getMany).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      20, // skip: (3 - 1) * 10
      10, // take
      prismaMock,
    );
  });

  it("restricts where clause to requestedById for requester role (HOUSEKEEPING)", async () => {
    mockedStockRequestRepository.getMany.mockResolvedValue([]);
    mockedStockRequestRepository.countRows.mockResolvedValue(0);

    await stockRequestService.getMany(
      housekeepingSession,
      baseFilters,
      prismaMock,
    );

    expect(mockedStockRequestRepository.getMany).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedById: housekeepingSession.id,
      }),
      expect.anything(),
      expect.anything(),
      0,
      10,
      prismaMock,
    );
  });

  it("does not restrict where clause to requestedById for HOTEL_MANAGER", async () => {
    mockedStockRequestRepository.getMany.mockResolvedValue([]);
    mockedStockRequestRepository.countRows.mockResolvedValue(0);

    await stockRequestService.getMany(managerSession, baseFilters, prismaMock);

    const whereArg = mockedStockRequestRepository.getMany.mock.calls[0][0];
    expect(whereArg.requestedById).toBeUndefined();
  });

  it("applies search filter when search length is at least 3 characters", async () => {
    mockedStockRequestRepository.getMany.mockResolvedValue([]);
    mockedStockRequestRepository.countRows.mockResolvedValue(0);

    const filtersWithSearch: StockRequestFilterSchema = {
      ...baseFilters,
      search: "towel",
    };

    await stockRequestService.getMany(
      managerSession,
      filtersWithSearch,
      prismaMock,
    );

    expect(mockedStockRequestRepository.getMany).toHaveBeenCalledWith(
      expect.objectContaining({
        OR: [
          {
            item: {
              name: {
                contains: "towel",
                mode: "insensitive",
              },
            },
          },
        ],
      }),
      expect.anything(),
      expect.anything(),
      0,
      10,
      prismaMock,
    );
  });

  it("ignores search filter when search length is less than 3 characters", async () => {
    mockedStockRequestRepository.getMany.mockResolvedValue([]);
    mockedStockRequestRepository.countRows.mockResolvedValue(0);

    const filtersWithShortSearch: StockRequestFilterSchema = {
      ...baseFilters,
      search: "to",
    };

    await stockRequestService.getMany(
      managerSession,
      filtersWithShortSearch,
      prismaMock,
    );

    const whereArg = mockedStockRequestRepository.getMany.mock.calls[0][0];
    expect(whereArg.OR).toBeUndefined();
  });

  it("applies type, status, and location filters", async () => {
    mockedStockRequestRepository.getMany.mockResolvedValue([]);
    mockedStockRequestRepository.countRows.mockResolvedValue(0);

    const filtersWithDetails: StockRequestFilterSchema = {
      ...baseFilters,
      type: "ISSUE",
      status: "PENDING",
      sourceLocationId: "loc-src",
      destinationLocationId: "loc-dst",
    };

    await stockRequestService.getMany(
      managerSession,
      filtersWithDetails,
      prismaMock,
    );

    expect(mockedStockRequestRepository.getMany).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ISSUE",
        status: "PENDING",
        sourceLocationId: "loc-src",
        destinationLocationId: "loc-dst",
      }),
      expect.anything(),
      expect.anything(),
      0,
      10,
      prismaMock,
    );
  });

  it.each([
    {
      sortBy: "itemName" as const,
      expectedOrderBy: { item: { name: "asc" } },
    },
    {
      sortBy: "sourceLocation" as const,
      expectedOrderBy: { sourceLocation: { name: "asc" } },
    },
    {
      sortBy: "destinationLocation" as const,
      expectedOrderBy: { destinationLocation: { name: "asc" } },
    },
    {
      sortBy: "createdAt" as const,
      expectedOrderBy: { createdAt: "asc" },
    },
  ])(
    "correctly maps sorting for sortBy: $sortBy",
    async ({ sortBy, expectedOrderBy }) => {
      mockedStockRequestRepository.getMany.mockResolvedValue([]);
      mockedStockRequestRepository.countRows.mockResolvedValue(0);

      const filter: StockRequestFilterSchema = {
        ...baseFilters,
        sortBy,
        sortOrder: "asc",
      };

      await stockRequestService.getMany(managerSession, filter, prismaMock);

      expect(mockedStockRequestRepository.getMany).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expectedOrderBy,
        0,
        10,
        prismaMock,
      );
    },
  );
});
