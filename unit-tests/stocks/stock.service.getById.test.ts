import stockService from "@/features/stocks/stock.service";
import {
  stockRepository,
  stockSelectData,
  stockWhereInput,
} from "@/features/stocks/stock.repository";
import { notFound } from "@/shared/lib/error-handlers";
import { PrismaClient } from "@prisma/client";
import { Session } from "next-auth";
import { mockDeep, mockReset } from "jest-mock-extended";
import { StockGetByIdSchema } from "@/shared/lib/zods/stock.zod";
import stockMovementsRepository from "@/features/stock-movements/stock-movements.repository";

jest.mock("@/features/stocks/stock.repository");
jest.mock("@/features/stock-movements/stock-movements.repository");

const mockedStockRepository = stockRepository as jest.Mocked<
  typeof stockRepository
>;

const mockedStockMovementRepository = stockMovementsRepository as jest.Mocked<
  typeof stockMovementsRepository
>;

const mockedStockWhereInput = stockWhereInput as jest.MockedFunction<
  typeof stockWhereInput
>;

const mockedSelectDataStock = stockSelectData as jest.MockedFunction<
  typeof stockSelectData
>;

const fakeSession = { id: "user-1", role: "HOTEL_MANAGER" } as Session["user"];
const prismaMock = mockDeep<PrismaClient>();

describe("stockService.getById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
  });

  it("returns the stock with the correct message when it exists", async () => {
    const stockMock = {
      id: "stock-1",
      quantity: 10,
      type: "READY",
      expiredAt: null,
      itemId: "item-1",
      locationId: "loc-1",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
      item: { id: "item-1", name: "Chocolate Cake" },
      location: { id: "loc-1", name: "Pantry A" },
      creator: { id: "user-1", name: "Alice" },
    };

    mockedStockRepository.getById.mockResolvedValue(stockMock as any);

    mockedStockWhereInput.mockReturnValue({ id: "stock-1" });

    mockedSelectDataStock.mockReturnValue({});

    mockedStockMovementRepository.countRows.mockResolvedValue(1 as any);

    const params: StockGetByIdSchema = {
      page: 1,
      dataPerPage: 10,
      sortOrder: "asc",
      sortBy: "createdAt",
    };

    const result = await stockService.getById(
      fakeSession,
      "stock-1",
      params,
      prismaMock,
    );

    expect(mockedStockRepository.getById).toHaveBeenCalledWith(
      { id: "stock-1" },
      {},
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock retrieved successfully",
      data: {
        movementsCount: 1,
        stock: stockMock,
      },
    });
  });

  it("throws notFound when stock does not exist", async () => {
    mockedStockRepository.getById.mockResolvedValue(null);

    const params: StockGetByIdSchema = {
      page: 1,
      dataPerPage: 10,
      sortOrder: "asc",
      sortBy: "createdAt",
    };

    await expect(
      stockService.getById(
        fakeSession,
        "nonexistent-stock",
        params,
        prismaMock,
      ),
    ).rejects.toEqual(notFound("Stock not found"));
  });
});
