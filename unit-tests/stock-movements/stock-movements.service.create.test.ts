import stockMovementsService from "@/features/stock-movements/stock-movements.service";
import stockMovementsRepository from "@/features/stock-movements/stock-movements.repository";
import itemRepository from "@/features/items/item.repository";
import { locationRepository } from "@/features/locations/location.repository";
import { stockRepository } from "@/features/stocks/stock.repository";
import orderRepository from "@/features/orders/order-repository";
import auditLogsRepository from "@/features/audit-logs/audit-log.repository";
import { badRequest, notFound } from "@/shared/lib/error-handlers";
import { PrismaClient, StockType, MovementType } from "@prisma/client";
import { Session } from "next-auth";
import { mockDeep, mockReset } from "jest-mock-extended";

jest.mock("@/features/stock-movements/stock-movements.repository");
jest.mock("@/features/items/item.repository");
jest.mock("@/features/locations/location.repository");
jest.mock("@/features/stocks/stock.repository");
jest.mock("@/features/orders/order-repository");
jest.mock("@/features/audit-logs/audit-log.repository");

const mockedStockMovementsRepository = stockMovementsRepository as jest.Mocked<
  typeof stockMovementsRepository
>;
const mockedItemRepository = itemRepository as jest.Mocked<
  typeof itemRepository
>;
const mockedLocationRepository = locationRepository as jest.Mocked<
  typeof locationRepository
>;
const mockedStockRepository = stockRepository as jest.Mocked<
  typeof stockRepository
>;
const mockedOrderRepository = orderRepository as jest.Mocked<
  typeof orderRepository
>;
const mockedAuditLogsRepository = auditLogsRepository as jest.Mocked<
  typeof auditLogsRepository
>;

const fakeSession = { id: "user-1", role: "HOTEL_MANAGER" } as Session["user"];
const prismaMock = mockDeep<PrismaClient>();

describe("stockMovementsService.create", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
    prismaMock.$transaction.mockImplementation((callback) =>
      callback(prismaMock),
    );
  });

  it("throws notFound when item does not exist", async () => {
    mockedItemRepository.findById.mockResolvedValue(null);

    const payload = {
      itemId: "nonexistent-item",
      stockMovementType: "RECEIVE" as MovementType,
      quantity: 10,
      reason: "Initial item receive description",
    };

    await expect(
      stockMovementsService.create(fakeSession, payload, prismaMock),
    ).rejects.toEqual(notFound("Item not found"));

    expect(mockedItemRepository.findById).toHaveBeenCalledWith(
      "nonexistent-item",
      prismaMock,
    );
  });

  it("throws notFound when stockId is provided but stock does not exist", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue(null);

    const payload = {
      itemId: "item-1",
      stockId: "nonexistent-stock",
      stockMovementType: "TRANSFER" as MovementType,
      quantity: 5,
      destinationLocationId: "loc-2",
      reason: "Transfering stock to loc 2 description",
    };

    await expect(
      stockMovementsService.create(fakeSession, payload, prismaMock),
    ).rejects.toEqual(notFound("Stock not found"));
  });

  it("throws notFound when destinationLocationId is provided but location does not exist", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue({ id: "stock-1" } as any);
    mockedLocationRepository.findById.mockResolvedValue(null);

    const payload = {
      itemId: "item-1",
      stockId: "stock-1",
      stockMovementType: "TRANSFER" as MovementType,
      quantity: 5,
      destinationLocationId: "nonexistent-loc",
      reason: "Transfering stock to nonexistent loc description",
    };

    await expect(
      stockMovementsService.create(fakeSession, payload, prismaMock),
    ).rejects.toEqual(notFound("Destination location not found"));
  });

  it("throws notFound when orderId is provided but order does not exist", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedOrderRepository.findById.mockResolvedValue(null);

    const payload = {
      itemId: "item-1",
      stockMovementType: "RECEIVE" as MovementType,
      quantity: 5,
      orderId: "nonexistent-order",
      reason: "Receiving for nonexistent order description",
    };

    await expect(
      stockMovementsService.create(fakeSession, payload, prismaMock),
    ).rejects.toEqual(notFound("Order not found"));
  });

  it("throws badRequest when stockId is missing for movement types requiring stockId", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedLocationRepository.findById.mockResolvedValue({ id: "loc-2" } as any);

    const payload = {
      itemId: "item-1",
      stockMovementType: "TRANSFER" as MovementType,
      quantity: 5,
      destinationLocationId: "loc-2",
      reason: "Transfering without stockId description",
    };

    await expect(
      stockMovementsService.create(fakeSession, payload, prismaMock),
    ).rejects.toEqual(
      badRequest("stockId is required for movement type 'TRANSFER'"),
    );
  });

  it("throws badRequest for LAUNDRY_IN if target stock is not READY type", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      type: "DAMAGED" as StockType,
    } as any);

    const payload = {
      itemId: "item-1",
      stockId: "stock-1",
      stockMovementType: "LAUNDRY_IN" as MovementType,
      quantity: 5,
      reason: "Laundry in to damaged stock description",
    };

    await expect(
      stockMovementsService.create(fakeSession, payload, prismaMock),
    ).rejects.toEqual(
      badRequest(
        "'Laundry In' type can only be located to the stock with ready type",
      ),
    );
  });

  it("creates a global RECEIVE movement when stockId is not provided", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);

    const mockMovement = {
      id: "movement-1",
      itemId: "item-1",
      stockId: null,
      type: "RECEIVE",
      quantity: 10,
      totalCost: 500,
      reason: "Global intake receive description",
      createdBy: "user-1",
      sourceLocationId: null,
      destinationLocationId: null,
      orderId: null,
    };
    mockedStockMovementsRepository.create.mockResolvedValue(
      mockMovement as any,
    );

    const payload = {
      itemId: "item-1",
      stockMovementType: "RECEIVE" as MovementType,
      quantity: 10,
      totalCost: 500,
      reason: "Global intake receive description",
    };

    const result = await stockMovementsService.create(
      fakeSession,
      payload,
      prismaMock,
    );

    expect(mockedStockMovementsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-1",
        stockId: undefined,
        type: "RECEIVE",
        quantity: 10,
        totalCost: 500,
        reason: "Global intake receive description",
        sourceLocationId: null,
      }),
      prismaMock,
    );

    expect(mockedAuditLogsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        action: "CREATE",
        entity: "STOCK_MOVEMENT",
        entityId: "movement-1",
      }),
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock movement created successfully",
      stockMovementId: "movement-1",
      stockId: null,
      itemId: "item-1",
    });
  });

  it("updates stock quantity and records RECEIVE/LAUNDRY_IN when stock exists", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
      type: "READY" as StockType,
    } as any);

    const mockMovement = {
      id: "movement-1",
      itemId: "item-1",
      stockId: "stock-1",
      type: "LAUNDRY_IN",
      quantity: 5,
      totalCost: 0,
      reason: "Laundry incoming ready description",
      createdBy: "user-1",
      sourceLocationId: null,
      destinationLocationId: "loc-1",
      orderId: null,
    };
    mockedStockMovementsRepository.create.mockResolvedValue(
      mockMovement as any,
    );

    const payload = {
      itemId: "item-1",
      stockId: "stock-1",
      stockMovementType: "LAUNDRY_IN" as MovementType,
      quantity: 5,
      reason: "Laundry incoming ready description",
    };

    const result = await stockMovementsService.create(
      fakeSession,
      payload,
      prismaMock,
    );

    expect(mockedStockMovementsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-1",
        stockId: "stock-1",
        type: "LAUNDRY_IN",
        quantity: 5,
        sourceLocationId: null,
        destinationLocationId: "loc-1",
      }),
      prismaMock,
    );

    expect(mockedStockRepository.update).toHaveBeenCalledWith(
      "stock-1",
      { quantity: { increment: 5 } },
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock movement created successfully",
      stockMovementId: "movement-1",
      stockId: "stock-1",
      itemId: "item-1",
    });
  });

  it("TRANSFER: throws badRequest if source and destination locations are identical", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
      quantity: 10,
    } as any);
    mockedLocationRepository.findById.mockResolvedValue({ id: "loc-1" } as any);

    const payload = {
      itemId: "item-1",
      stockId: "stock-1",
      stockMovementType: "TRANSFER" as MovementType,
      quantity: 5,
      destinationLocationId: "loc-1",
      reason: "Transfering to same location description",
    };

    await expect(
      stockMovementsService.create(fakeSession, payload, prismaMock),
    ).rejects.toEqual(
      badRequest("Source location and destination location can't be same"),
    );
  });

  it("TRANSFER: throws badRequest if stock quantity is insufficient", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
      quantity: 4,
    } as any);
    mockedLocationRepository.findById.mockResolvedValue({ id: "loc-2" } as any);

    const payload = {
      itemId: "item-1",
      stockId: "stock-1",
      stockMovementType: "TRANSFER" as MovementType,
      quantity: 5,
      destinationLocationId: "loc-2",
      reason: "Insufficient stock transfer description",
    };

    await expect(
      stockMovementsService.create(fakeSession, payload, prismaMock),
    ).rejects.toEqual(badRequest("Insufficient stock quantity."));
  });

  it("TRANSFER: successfully transfers stock, updates source/dest stock, and creates transfer movement", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      locationId: "loc-1",
      quantity: 10,
      expiredAt: null,
      type: "READY" as StockType,
      itemId: "item-1",
    } as any);
    mockedLocationRepository.findById.mockResolvedValue({ id: "loc-2" } as any);

    mockedStockRepository.findOrUpdateOrCreate.mockResolvedValue({
      id: "stock-dest",
    } as any);

    const mockMovement = {
      id: "movement-1",
      itemId: "item-1",
      stockId: "stock-dest",
      type: "TRANSFER",
      quantity: 5,
      createdBy: "user-1",
    };
    mockedStockMovementsRepository.create.mockResolvedValue(
      mockMovement as any,
    );

    const payload = {
      itemId: "item-1",
      stockId: "stock-1",
      stockMovementType: "TRANSFER" as MovementType,
      quantity: 5,
      destinationLocationId: "loc-2",
      reason: "Transfering stock to loc 2 description",
    };

    const result = await stockMovementsService.create(
      fakeSession,
      payload,
      prismaMock,
    );

    expect(mockedStockRepository.findOrUpdateOrCreate).toHaveBeenCalledWith(
      {
        expiredAt: null,
        locationId: "loc-2",
        itemId: "item-1",
        type: "READY",
      },
      {
        quantity: { increment: 5 },
      },
      expect.objectContaining({
        quantity: 5,
        type: "READY",
      }),
      prismaMock,
    );

    expect(mockedStockRepository.update).toHaveBeenCalledWith(
      "stock-1",
      { quantity: { decrement: 5 } },
      prismaMock,
    );

    expect(mockedStockMovementsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stockId: "stock-dest",
        type: "TRANSFER",
        totalCost: null,
      }),
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock movement created successfully",
      stockMovementId: "movement-1",
      stockId: "stock-dest",
      itemId: "item-1",
    });
  });

  it("ADJUSTMENT: throws badRequest if resulting quantity is negative", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      quantity: 4,
    } as any);

    const payload = {
      itemId: "item-1",
      stockId: "stock-1",
      stockMovementType: "ADJUSTMENT" as MovementType,
      quantity: -5,
      reason: "Adjustment that goes negative description",
    };

    await expect(
      stockMovementsService.create(fakeSession, payload, prismaMock),
    ).rejects.toEqual(badRequest("Insufficient stock quantity."));
  });

  it("ADJUSTMENT: successfully updates stock quantity and creates adjustment movement", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      quantity: 10,
      locationId: "loc-1",
    } as any);

    const mockMovement = {
      id: "movement-1",
      itemId: "item-1",
      stockId: "stock-1",
      type: "ADJUSTMENT",
      quantity: 5,
      createdBy: "user-1",
    };
    mockedStockMovementsRepository.create.mockResolvedValue(
      mockMovement as any,
    );

    const payload = {
      itemId: "item-1",
      stockId: "stock-1",
      stockMovementType: "ADJUSTMENT" as MovementType,
      quantity: 5,
      reason: "Adjustment adding stock description",
    };

    const result = await stockMovementsService.create(
      fakeSession,
      payload,
      prismaMock,
    );

    expect(mockedStockMovementsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-1",
        stockId: "stock-1",
        type: "ADJUSTMENT",
        sourceLocationId: "loc-1",
        destinationLocationId: "loc-1",
      }),
      prismaMock,
    );

    expect(mockedStockRepository.update).toHaveBeenCalledWith(
      "stock-1",
      { quantity: { increment: 5 } },
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock movement created successfully",
      stockMovementId: "movement-1",
      stockId: "stock-1",
      itemId: "item-1",
    });
  });

  it("MARK_AS_DAMAGED: throws badRequest if quantity is insufficient", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      quantity: 4,
    } as any);

    const payload = {
      itemId: "item-1",
      stockId: "stock-1",
      stockMovementType: "MARK_AS_DAMAGED" as MovementType,
      quantity: 5,
      reason: "Marking more than exists as damaged description",
    };

    await expect(
      stockMovementsService.create(fakeSession, payload, prismaMock),
    ).rejects.toEqual(badRequest("Insufficient stock quantity."));
  });

  it("MARK_AS_DAMAGED: successfully decrements source stock, finds/updates/creates target stock, and records movement", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      itemId: "item-1",
      locationId: "loc-1",
      quantity: 10,
      expiredAt: null,
      type: "READY" as StockType,
    } as any);

    mockedStockRepository.findOrUpdateOrCreate.mockResolvedValue({
      id: "stock-damaged",
    } as any);

    const mockMovement = {
      id: "movement-1",
      itemId: "item-1",
      stockId: "stock-damaged",
      type: "MARK_AS_DAMAGED",
      quantity: 3,
      createdBy: "user-1",
    };
    mockedStockMovementsRepository.create.mockResolvedValue(
      mockMovement as any,
    );

    const payload = {
      itemId: "item-1",
      stockId: "stock-1",
      stockMovementType: "MARK_AS_DAMAGED" as MovementType,
      quantity: 3,
      reason: "Marking 3 items as damaged description",
    };

    const result = await stockMovementsService.create(
      fakeSession,
      payload,
      prismaMock,
    );

    expect(mockedStockRepository.update).toHaveBeenCalledWith(
      "stock-1",
      { quantity: { decrement: 3 } },
      prismaMock,
    );

    expect(mockedStockRepository.findOrUpdateOrCreate).toHaveBeenCalledWith(
      {
        itemId: "item-1",
        locationId: "loc-1",
        type: "DAMAGED",
        expiredAt: null,
      },
      { quantity: { increment: 3 } },
      expect.objectContaining({
        quantity: 3,
        type: "DAMAGED",
      }),
      prismaMock,
    );

    expect(mockedStockMovementsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stockId: "stock-damaged",
        type: "MARK_AS_DAMAGED",
        sourceLocationId: "loc-1",
        destinationLocationId: "loc-1",
      }),
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock movement created successfully",
      stockMovementId: "movement-1",
      stockId: "stock-damaged",
      itemId: "item-1",
    });
  });

  it("DISCARD: throws badRequest if current stock type is LOST", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      type: "LOST" as StockType,
      quantity: 10,
    } as any);

    const payload = {
      itemId: "item-1",
      stockId: "stock-1",
      stockMovementType: "DISCARD" as MovementType,
      quantity: 5,
      reason: "Trying to discard a lost item description",
    };

    await expect(
      stockMovementsService.create(fakeSession, payload, prismaMock),
    ).rejects.toEqual(badRequest("Can't delete a lost item"));
  });

  it("Decrease stock quantity movement (DISCARD, LAUNDRY_OUT, CONSUME, SALE): throws badRequest if quantity is insufficient", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      type: "READY" as StockType,
      quantity: 4,
    } as any);

    const payload = {
      itemId: "item-1",
      stockId: "stock-1",
      stockMovementType: "CONSUME" as MovementType,
      quantity: 5,
      reason: "Consuming more than exists description",
    };

    await expect(
      stockMovementsService.create(fakeSession, payload, prismaMock),
    ).rejects.toEqual(badRequest("Insufficient stock quantity."));
  });

  it("Decrease stock quantity movement: successfully decrements stock, records movement with destinationLocationId null", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    mockedStockRepository.findById.mockResolvedValue({
      id: "stock-1",
      type: "READY" as StockType,
      quantity: 10,
    } as any);

    const mockMovement = {
      id: "movement-1",
      itemId: "item-1",
      stockId: "stock-1",
      type: "CONSUME",
      quantity: 5,
      createdBy: "user-1",
    };
    mockedStockMovementsRepository.create.mockResolvedValue(
      mockMovement as any,
    );

    const payload = {
      itemId: "item-1",
      stockId: "stock-1",
      stockMovementType: "CONSUME" as MovementType,
      quantity: 5,
      reason: "Consuming 5 items description",
    };

    const result = await stockMovementsService.create(
      fakeSession,
      payload,
      prismaMock,
    );

    expect(mockedStockRepository.update).toHaveBeenCalledWith(
      "stock-1",
      { quantity: { decrement: 5 } },
      prismaMock,
    );

    expect(mockedStockMovementsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-1",
        stockId: "stock-1",
        type: "CONSUME",
        destinationLocationId: null,
      }),
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock movement created successfully",
      stockMovementId: "movement-1",
      stockId: "stock-1",
      itemId: "item-1",
    });
  });

  it("throws badRequest if transaction result is null", async () => {
    mockedItemRepository.findById.mockResolvedValue({ id: "item-1" } as any);
    prismaMock.$transaction.mockResolvedValue(null);

    const payload = {
      itemId: "item-1",
      stockMovementType: "RECEIVE" as MovementType,
      quantity: 10,
      reason: "Global intake receive description",
    };

    await expect(
      stockMovementsService.create(fakeSession, payload, prismaMock),
    ).rejects.toEqual(
      badRequest("Something went wrong, no stock movement record has created"),
    );
  });
});
