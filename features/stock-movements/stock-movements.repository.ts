import { StockMovementGetManySchema } from "@/shared/lib/zods/stock-movements.zod";
import { Prisma, PrismaClient } from "@prisma/client";

export const createSelectStockMovementData = <
  T extends Prisma.StockMovementSelect,
>(
  select: T,
): T => select;

const stockMovementsRepository = {
  findOne: async (
    where: Prisma.StockMovementWhereInput,
    select: Prisma.StockMovementSelect,
    tx: Prisma.TransactionClient | PrismaClient,
  ) => {
    return tx.stockMovement.findFirst({
      where,
      select,
    });
  },

  create: async (
    data: Prisma.StockMovementUncheckedCreateInput,
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    return await tx.stockMovement.create({
      data,
    });
  },

  getById: async (
    movementId: string,
    select: Prisma.StockMovementSelect,
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    return await tx.stockMovement.findUnique({
      where: { id: movementId },
      select,
    });
  },

  getMany: async (
    where: Prisma.StockMovementWhereInput,
    select: Prisma.StockMovementSelect,
    skip: number,
    take: number,
    sortBy: StockMovementGetManySchema["sortBy"],
    sortOrder: "asc" | "desc",
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    return await tx.stockMovement.findMany({
      where,
      select,
      skip,
      take,
      ...(sortBy === "name"
        ? {
            orderBy: {
              item: {
                name: sortOrder,
              },
            },
          }
        : {}),
      ...(sortBy === "createdAt"
        ? {
            orderBy: {
              createdAt: sortOrder,
            },
          }
        : {}),
      ...(sortBy === "type"
        ? {
            orderBy: {
              type: sortOrder,
            },
          }
        : {}),
      ...(sortBy === "destinationLocation"
        ? {
            orderBy: {
              destinationLocation: {
                name: sortOrder,
              },
            },
          }
        : {}),
      ...(sortBy === "sourceLocation"
        ? {
            orderBy: {
              sourceLocation: {
                name: sortOrder,
              },
            },
          }
        : {}),
    });
  },

  countRows: async (
    where: Prisma.StockMovementWhereInput,
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    return await tx.stockMovement.count({
      where,
    });
  },

  countQuantity: async (
    where: Prisma.StockMovementWhereInput,
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    const result = await tx.stockMovement.aggregate({
      where,
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity;
  },

  update: async (
    movementId: string,
    data: Prisma.StockMovementUpdateInput,
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    return await tx.stockMovement.update({
      where: { id: movementId },
      data,
    });
  },

  delete: async (
    movementId: string,
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    return await tx.stockMovement.delete({
      where: { id: movementId },
    });
  },
};

export default stockMovementsRepository;
