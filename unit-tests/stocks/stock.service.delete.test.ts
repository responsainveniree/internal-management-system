import stockService from "@/features/stocks/stock.service";
import { stockRepository } from "@/features/stocks/stock.repository";
import auditLogsRepository from "@/features/audit-logs/audit-log.repository";
import { notFound } from "@/shared/lib/error-handlers";
import { PrismaClient } from "@prisma/client";
import { Session } from "next-auth";
import { mockDeep, mockReset } from "jest-mock-extended";

jest.mock("@/features/stocks/stock.repository");
jest.mock("@/features/audit-logs/audit-log.repository");

const mockedStockRepository = stockRepository as jest.Mocked<
  typeof stockRepository
>;
const mockedAuditLogsRepository = auditLogsRepository as jest.Mocked<
  typeof auditLogsRepository
>;

const fakeSession = { id: "user-1", role: "HOTEL_MANAGER" } as Session["user"];
const prismaMock = mockDeep<PrismaClient>();

describe("stockService.delete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
  });

  it("successfully deletes the stock and writes a DELETE audit log", async () => {
    prismaMock.$transaction.mockImplementation((callback) =>
      callback(prismaMock),
    );

    const existingStock = {
      id: "stock-1",
      quantity: 5,
      type: "READY",
      expiredAt: null,
      itemId: "item-1",
      locationId: "loc-1",
      movements: [], // no movements — deletion is allowed
      item: { id: "item-1" },
    };

    mockedStockRepository.getById.mockResolvedValue(existingStock as any);
    mockedStockRepository.delete.mockResolvedValue({
      id: "stock-1",
    } as any);

    const result = await stockService.delete(
      fakeSession,
      "stock-1",
      prismaMock,
    );

    expect(mockedStockRepository.delete).toHaveBeenCalledWith(
      "stock-1",
      prismaMock,
    );

    expect(mockedAuditLogsRepository.create).toHaveBeenCalledWith(
      {
        userId: "user-1",
        action: "DELETE",
        entity: "STOCK",
        entityId: "stock-1",
        metadata: {
          id: "stock-1",
          itemId: "item-1",
          locationId: "loc-1",
          quantity: 5,
          type: "READY",
        },
      },
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock deleted successfully",
      data: {
        itemId: "item-1",
        stockId: "stock-1",
      },
    });
  });

  it("throws notFound when stock does not exist", async () => {
    prismaMock.$transaction.mockImplementation((callback) =>
      callback(prismaMock),
    );

    mockedStockRepository.getById.mockResolvedValue(null);

    await expect(
      stockService.delete(fakeSession, "nonexistent-stock", prismaMock),
    ).rejects.toEqual(notFound("Stock not found"));

    expect(mockedStockRepository.delete).not.toHaveBeenCalled();
    expect(mockedAuditLogsRepository.create).not.toHaveBeenCalled();
  });

  it("does not write an audit log if repository delete throws", async () => {
    prismaMock.$transaction.mockImplementation((callback) =>
      callback(prismaMock),
    );

    mockedStockRepository.getById.mockResolvedValue({
      id: "stock-1",
      quantity: 5,
      type: "READY",
      expiredAt: null,
      itemId: "item-1",
      locationId: "loc-1",
      movements: [],
      item: { id: "item-1" },
    } as any);
    mockedStockRepository.delete.mockRejectedValue(
      new Error("Database delete failed"),
    );

    await expect(
      stockService.delete(fakeSession, "stock-1", prismaMock),
    ).rejects.toThrow("Database delete failed");

    expect(mockedAuditLogsRepository.create).not.toHaveBeenCalled();
  });
});
