import stockService from "@/features/stocks/stock.service";
import { stockRepository } from "@/features/stocks/stock.repository";
import { locationRepository } from "@/features/locations/location.repository";
import auditLogsRepository from "@/features/audit-logs/audit-log.repository";
import { badRequest, notFound } from "@/shared/lib/error-handlers";
import { PrismaClient, StockType } from "@prisma/client";
import { Session } from "next-auth";
import { mockDeep, mockReset } from "jest-mock-extended";

jest.mock("@/features/stocks/stock.repository");
jest.mock("@/features/locations/location.repository");
jest.mock("@/features/audit-logs/audit-log.repository");

const mockedStockRepository = stockRepository as jest.Mocked<
  typeof stockRepository
>;
const mockedLocationRepository = locationRepository as jest.Mocked<
  typeof locationRepository
>;
const mockedAuditLogsRepository = auditLogsRepository as jest.Mocked<
  typeof auditLogsRepository
>;

const fakeSession = { id: "user-1", role: "HOTEL_MANAGER" } as Session["user"];
const prismaMock = mockDeep<PrismaClient>();

describe("stockService.update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
  });

  it("updates the stock and writes an UPDATE audit log with old and new values", async () => {
    prismaMock.$transaction.mockImplementation((callback) =>
      callback(prismaMock),
    );

    const existingStock = {
      quantity: 5,
      type: "READY",
      expiredAt: null,
      locationId: "loc-1",
      itemId: "item-1",
    };

    const updatedStock = {
      id: "stock-1",
      quantity: 5,
      type: "DAMAGED",
      expiredAt: null,
      locationId: "loc-2",
      itemId: "item-1",
    };

    mockedStockRepository.getById.mockResolvedValue(existingStock as any);
    prismaMock.stock.findFirst.mockResolvedValue(null); // no conflict
    mockedLocationRepository.findById.mockResolvedValue({
      id: "loc-2",
    } as any);
    mockedStockRepository.update.mockResolvedValue(updatedStock as any);

    const expiredDate = new Date();

    expiredDate.setDate(expiredDate.getDate() + 14);

    const updateData = {
      type: "DAMAGED" as StockType,
      expiredAt: expiredDate,
      locationId: "loc-2",
    };

    const result = await stockService.update(
      fakeSession,
      "stock-1",
      updateData,
      prismaMock,
    );

    expect(mockedStockRepository.update).toHaveBeenCalledWith(
      "stock-1",
      expect.objectContaining({
        type: "DAMAGED",
        expiredAt: expiredDate,
        location: { connect: { id: "loc-2" } },
      }),
      prismaMock,
    );

    expect(mockedAuditLogsRepository.create).toHaveBeenCalledWith(
      {
        userId: "user-1",
        action: "UPDATE",
        entity: "STOCK",
        entityId: "stock-1",
        metadata: {
          id: "stock-1",
          old: {
            quantity: 5,
            type: "READY",
            expiredAt: null,
            locationId: "loc-1",
          },
          new: {
            quantity: 5,
            type: "DAMAGED",
            expiredAt: null,
            locationId: "loc-2",
          },
        },
      },
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock updated successfully",
      id: "stock-1",
    });
  });

  it("throws badRequest when changing to a location/type/expiredAt that conflicts with another stock", async () => {
    prismaMock.$transaction.mockImplementation((callback) =>
      callback(prismaMock),
    );

    const existingStock = {
      quantity: 5,
      type: "READY",
      expiredAt: null,
      locationId: "loc-1",
      itemId: "item-1",
    };

    // A different stock already occupies the target location/type/expiredAt combo
    const conflictingStock = { id: "conflicting-stock-1" };

    mockedStockRepository.getById.mockResolvedValue(existingStock as any);
    prismaMock.stock.findFirst.mockResolvedValue(conflictingStock as any);

    const expiredDate = new Date();

    expiredDate.setDate(expiredDate.getDate() + 14);

    const updateData = {
      type: "READY" as StockType,
      expiredAt: expiredDate,
      locationId: "loc-2",
    };

    await expect(
      stockService.update(
        fakeSession,
        "conflicting-stock-1",
        updateData,
        prismaMock,
      ),
    ).rejects.toEqual(
      badRequest(
        "Another stock with this item, location, and type already exists",
      ),
    );

    expect(mockedStockRepository.update).not.toHaveBeenCalled();
    expect(mockedAuditLogsRepository.create).not.toHaveBeenCalled();
  });

  it("throws notFound when the stock to update does not exist", async () => {
    prismaMock.$transaction.mockImplementation((callback) =>
      callback(prismaMock),
    );

    mockedStockRepository.getById.mockResolvedValue(null);

    const expiredDate = new Date();

    expiredDate.setDate(expiredDate.getDate() + 14);

    const updateData = {
      type: "READY" as StockType,
      expiredAt: expiredDate,
      locationId: "loc-1",
    };

    await expect(
      stockService.update(
        fakeSession,
        "nonexistent-stock",
        updateData,
        prismaMock,
      ),
    ).rejects.toEqual(notFound("Stock not found"));

    expect(mockedStockRepository.update).not.toHaveBeenCalled();
    expect(mockedAuditLogsRepository.create).not.toHaveBeenCalled();
  });

  it("throws notFound when the target location does not exist", async () => {
    prismaMock.$transaction.mockImplementation((callback) =>
      callback(prismaMock),
    );

    mockedStockRepository.getById.mockResolvedValue({
      quantity: 5,
      type: "READY",
      expiredAt: null,
      locationId: "loc-1",
      itemId: "item-1",
    } as any);
    prismaMock.stock.findFirst.mockResolvedValue(null);
    mockedLocationRepository.findById.mockResolvedValue(null);

    const expiredDate = new Date();

    expiredDate.setDate(expiredDate.getDate() + 14);

    const updateData = {
      type: "READY" as StockType,
      expiredAt: expiredDate,
      locationId: "loc-1",
    };

    await expect(
      stockService.update(fakeSession, "stock-1", updateData, prismaMock),
    ).rejects.toEqual(notFound("Location not found"));

    expect(mockedStockRepository.update).not.toHaveBeenCalled();
    expect(mockedAuditLogsRepository.create).not.toHaveBeenCalled();
  });

  it("does not write an audit log if repository update throws", async () => {
    prismaMock.$transaction.mockImplementation((callback) =>
      callback(prismaMock),
    );

    mockedStockRepository.getById.mockResolvedValue({
      quantity: 5,
      type: "READY",
      expiredAt: null,
      locationId: "loc-1",
      itemId: "item-1",
    } as any);
    prismaMock.stock.findFirst.mockResolvedValue(null);
    mockedLocationRepository.findById.mockResolvedValue({ id: "loc-1" } as any);
    mockedStockRepository.update.mockRejectedValue(
      new Error("Database update failed"),
    );

    const expiredDate = new Date();

    expiredDate.setDate(expiredDate.getDate() + 14);

    const updateData = {
      type: "READY" as StockType,
      expiredAt: expiredDate,
      locationId: "loc-1",
    };

    await expect(
      stockService.update(fakeSession, "stock-1", updateData, prismaMock),
    ).rejects.toThrow("Database update failed");

    expect(mockedAuditLogsRepository.create).not.toHaveBeenCalled();
  });
});
