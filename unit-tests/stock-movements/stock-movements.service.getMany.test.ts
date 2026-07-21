import stockMovementsService from "@/features/stock-movements/stock-movements.service";
import stockMovementsRepository, {
  createSelectStockMovementData,
} from "@/features/stock-movements/stock-movements.repository";
import { forbidden } from "@/shared/lib/error-handlers";
import { PrismaClient, MovementType } from "@prisma/client";
import { Session } from "next-auth";
import { mockDeep } from "jest-mock-extended";

jest.mock("@/features/stock-movements/stock-movements.repository");

const mockedStockMovementsRepository = stockMovementsRepository as jest.Mocked<
  typeof stockMovementsRepository
>;

const mockedcreateSelectStockMovementData =
  createSelectStockMovementData as jest.MockedFunction<
    typeof createSelectStockMovementData
  >;

const fakeSession = { id: "user-1", role: "HOTEL_MANAGER" } as Session["user"];
const fakeStaffSession = {
  id: "user-2",
  role: "ACCOUNTANT",
} as Session["user"];
const prismaMock = mockDeep<PrismaClient>();

describe("stockMovementsService.getMany", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws forbidden when session role is not allowed to manage items", async () => {
    const params = {
      page: 1,
      dataPerPage: 10,
      sortBy: "createdAt" as const,
      sortOrder: "asc" as const,
    };

    await expect(
      stockMovementsService.getMany(fakeStaffSession, params, prismaMock),
    ).rejects.toEqual(forbidden("You're not allowed to access this feature"));
  });

  it("retrieves a paginated list of stock movements with correct parameters", async () => {
    const movementsMock = [
      { id: "movement-1", quantity: 10 },
      { id: "movement-2", quantity: 5 },
    ];
    mockedStockMovementsRepository.getMany.mockResolvedValue(
      movementsMock as any,
    );
    mockedStockMovementsRepository.countRows.mockResolvedValue(2);

    mockedcreateSelectStockMovementData.mockReturnValue({
      id: true,
      quantity: true,
      totalCost: true,
      type: true,
      reason: true,
      itemId: true,
      stockId: true,
      sourceLocationId: true,
      destinationLocationId: true,
      orderId: true,
      createdAt: true,
      item: { select: { id: true, name: true } },
      stock: { select: { id: true, quantity: true, type: true } },
      sourceLocation: { select: { id: true, name: true } },
      destinationLocation: { select: { id: true, name: true } },
      order: { select: { id: true, roomNumber: true, guestName: true } },
      user: { select: { id: true, name: true } },
    });

    const params = {
      page: 2,
      dataPerPage: 10,
      sortBy: "createdAt" as const,
      sortOrder: "desc" as const,
    };

    const result = await stockMovementsService.getMany(
      fakeSession,
      params,
      prismaMock,
    );

    expect(mockedStockMovementsRepository.getMany).toHaveBeenCalledWith(
      {},
      {
        id: true,
        quantity: true,
        totalCost: true,
        type: true,
        reason: true,
        itemId: true,
        stockId: true,
        sourceLocationId: true,
        destinationLocationId: true,
        orderId: true,
        createdAt: true,
        item: { select: { id: true, name: true } },
        stock: { select: { id: true, quantity: true, type: true } },
        sourceLocation: { select: { id: true, name: true } },
        destinationLocation: { select: { id: true, name: true } },
        order: { select: { id: true, roomNumber: true, guestName: true } },
        user: { select: { id: true, name: true } },
      },
      10, // skip = (2 - 1) * 10
      10, // take
      "createdAt",
      "desc",
      prismaMock,
    );

    expect(mockedStockMovementsRepository.countRows).toHaveBeenCalledWith(
      {},
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock movements retrieved successfully",
      data: {
        movements: movementsMock,
        totalCount: 2,
      },
    });
  });

  it("applies searchQuery filter on item name and reason when searchQuery >= 3 chars and sortBy is name", async () => {
    mockedStockMovementsRepository.getMany.mockResolvedValue([]);
    mockedStockMovementsRepository.countRows.mockResolvedValue(0);

    const params = {
      page: 1,
      dataPerPage: 10,
      sortBy: "name" as const,
      sortOrder: "asc" as const,
      searchQuery: "Pantry",
    };

    await stockMovementsService.getMany(fakeSession, params, prismaMock);

    const expectedWhere = {
      OR: [
        { item: { name: { contains: "Pantry", mode: "insensitive" } } },
        { itemName: { contains: "Pantry", mode: "insensitive" } },
        { reason: { contains: "Pantry", mode: "insensitive" } },
      ],
    };

    expect(mockedStockMovementsRepository.getMany).toHaveBeenCalledWith(
      expectedWhere,
      expect.any(Object),
      0,
      10,
      "name",
      "asc",
      prismaMock,
    );
  });

  it("filters by type, sourceLocationId, or destinationLocationId if provided", async () => {
    mockedStockMovementsRepository.getMany.mockResolvedValue([]);
    mockedStockMovementsRepository.countRows.mockResolvedValue(0);

    const params = {
      page: 1,
      dataPerPage: 10,
      sortBy: "type" as const,
      sortOrder: "asc" as const,
      type: "RECEIVE" as MovementType,
    };

    await stockMovementsService.getMany(fakeSession, params, prismaMock);

    expect(mockedStockMovementsRepository.getMany).toHaveBeenCalledWith(
      expect.objectContaining({ type: "RECEIVE" }),
      expect.any(Object),
      0,
      10,
      "type",
      "asc",
      prismaMock,
    );
  });
});
