import stockMovementsService from "@/features/stock-movements/stock-movements.service";
import stockMovementsRepository from "@/features/stock-movements/stock-movements.repository";
import auditLogsRepository from "@/features/audit-logs/audit-log.repository";
import { forbidden, notFound } from "@/shared/lib/error-handlers";
import { PrismaClient } from "@prisma/client";
import { Session } from "next-auth";
import { mockDeep, mockReset } from "jest-mock-extended";

jest.mock("@/features/stock-movements/stock-movements.repository");
jest.mock("@/features/audit-logs/audit-log.repository");

const mockedStockMovementsRepository = stockMovementsRepository as jest.Mocked<
  typeof stockMovementsRepository
>;
const mockedAuditLogsRepository = auditLogsRepository as jest.Mocked<
  typeof auditLogsRepository
>;

const fakeSession = { id: "user-1", role: "HOTEL_MANAGER" } as Session["user"];
const wrongStaffSession = {
  id: "user-2",
  role: "ACCOUNTANT",
} as Session["user"];
const prismaMock = mockDeep<PrismaClient>();

describe("stockMovementsService.update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
    prismaMock.$transaction.mockImplementation((callback) =>
      callback(prismaMock),
    );
  });

  it("throws forbidden when session role is not allowed to manage items", async () => {
    const data = { reason: "Reason updated version description" };

    await expect(
      stockMovementsService.update(
        wrongStaffSession,
        "movement-1",
        data,
        prismaMock,
      ),
    ).rejects.toEqual(forbidden("You're not allowed to access this feature"));
  });

  it("throws notFound when stock movement does not exist", async () => {
    mockedStockMovementsRepository.getById.mockResolvedValue(null);

    const data = { reason: "Reason updated version description" };

    await expect(
      stockMovementsService.update(
        fakeSession,
        "nonexistent-movement",
        data,
        prismaMock,
      ),
    ).rejects.toEqual(notFound("Stock movement not found"));
  });

  it("updates the stock movement reason and records an UPDATE audit log", async () => {
    const existingMovement = {
      id: "movement-1",
      reason: "Original reason description",
    };
    mockedStockMovementsRepository.getById.mockResolvedValue(
      existingMovement as any,
    );

    const updatedMovement = {
      id: "movement-1",
      reason: "Reason updated version description",
      itemId: "item-1",
      stockId: "stock-1",
    };
    mockedStockMovementsRepository.update.mockResolvedValue(
      updatedMovement as any,
    );

    const data = { reason: "Reason updated version description" };

    const result = await stockMovementsService.update(
      fakeSession,
      "movement-1",
      data,
      prismaMock,
    );

    expect(mockedStockMovementsRepository.getById).toHaveBeenCalledWith(
      "movement-1",
      { id: true, reason: true },
      prismaMock,
    );

    expect(mockedStockMovementsRepository.update).toHaveBeenCalledWith(
      "movement-1",
      { reason: "Reason updated version description" },
      prismaMock,
    );

    expect(mockedAuditLogsRepository.create).toHaveBeenCalledWith(
      {
        userId: "user-1",
        action: "UPDATE",
        entity: "STOCK_MOVEMENT",
        entityId: "movement-1",
        metadata: {
          id: "movement-1",
          old: { reason: "Original reason description" },
          new: { reason: "Reason updated version description" },
        },
      },
      prismaMock,
    );

    expect(result).toEqual({
      message: "Stock movement updated successfully",
      id: "movement-1",
      itemId: "item-1",
      stockId: "stock-1",
    });
  });
});
