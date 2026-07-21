import stockMovementsService from "@/features/stock-movements/stock-movements.service";
import stockMovementsRepository, {
  createSelectStockMovementData,
} from "@/features/stock-movements/stock-movements.repository";
import { forbidden, notFound } from "@/shared/lib/error-handlers";
import { PrismaClient } from "@prisma/client";
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
const wrongStaffSession = {
  id: "user-2",
  role: "ACCOUNTANT",
} as Session["user"];
const prismaMock = mockDeep<PrismaClient>();

describe("stockMovementsService.getById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws forbidden when session role is not allowed to manage items", async () => {
    await expect(
      stockMovementsService.getById(
        wrongStaffSession,
        "movement-1",
        prismaMock,
      ),
    ).rejects.toEqual(forbidden("You're not allowed to access this feature"));

    expect(mockedStockMovementsRepository.getById).not.toHaveBeenCalled();
  });

  it("throws notFound when stock movement is not found", async () => {
    mockedStockMovementsRepository.getById.mockResolvedValue(null);

    await expect(
      stockMovementsService.getById(
        fakeSession,
        "nonexistent-movement",
        prismaMock,
      ),
    ).rejects.toEqual(notFound("Stock movement not found"));
  });

  it("returns the stock movement record when retrieved successfully", async () => {
    const mockMovement = {
      id: "movement-1",
      quantity: 10,
      type: "RECEIVE",
      reason: "Intake",
    };
    mockedStockMovementsRepository.getById.mockResolvedValue(
      mockMovement as any,
    );

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

    const result = await stockMovementsService.getById(
      fakeSession,
      "movement-1",
      prismaMock,
    );

    expect(mockedStockMovementsRepository.getById).toHaveBeenCalledWith(
      "movement-1",
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
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock movement retrieved successfully",
      data: mockMovement,
    });
  });
});
