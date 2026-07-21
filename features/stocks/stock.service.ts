import { badRequest, notFound } from "@/shared/lib/error-handlers";
import {
  StockCreateSchema,
  StockGetByIdSchema,
  StockGetManySchema,
  StockUpdateSchema,
} from "@/shared/lib/zods/stock.zod";
import auditLogsRepository from "../audit-logs/audit-log.repository";
import {
  stockRepository,
  stockSelectData,
  stockWhereInput,
} from "./stock.repository";
import { Prisma, PrismaClient, StockType } from "@prisma/client";
import { Session } from "next-auth";
import { locationRepository } from "../locations/location.repository";
import { stockRules } from "./stock.rule";
import stockMovementsRepository from "../stock-movements/stock-movements.repository";

const stockService = {
  create: async (
    session: Session["user"],
    data: StockCreateSchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const created = await prisma.$transaction(async (tx) => {
      // Check if item exists
      const item = await tx.item.findUnique({
        where: { id: data.itemId },
      });
      if (!item) {
        throw notFound("Item not found");
      }

      // Check if stock with same itemId, locationId, and type already exists
      const existing = await tx.stock.findFirst({
        where: {
          itemId: data.itemId,
          locationId: data.locationId,
          type: data.type as StockType,
          expiredAt: data.expiredAt,
        },
      });

      // Check if location exists
      const location = await tx.location.findUnique({
        where: { id: data.locationId },
      });
      if (!location) {
        throw notFound("Location not found");
      }

      let stock;

      if (existing) {
        stock = await stockRepository.update(
          existing.id,
          {
            quantity: {
              increment: data.quantity,
            },
            movements: {
              create: {
                itemName: item.name,
                type: "RECEIVE",
                quantity: data.quantity,
                itemId: data.itemId,
                destinationLocationId: data.locationId,
                createdBy: session.id,
                reason: data.reason,
                totalCost: data.totalCost,
              },
            },
          },
          tx,
        );
      } else {
        stock = await stockRepository.create(
          {
            quantity: data.quantity,
            type: data.type as StockType,
            expiredAt: data.expiredAt,
            item: {
              connect: {
                id: data.itemId,
              },
            },
            location: {
              connect: {
                id: data.locationId,
              },
            },
            creator: {
              connect: {
                id: session.id,
              },
            },
            movements: {
              create: {
                type: "RECEIVE",
                itemName: item.name,
                quantity: data.quantity,
                itemId: data.itemId,
                destinationLocationId: data.locationId,
                createdBy: session.id,
                reason: data.reason,
                totalCost: data.totalCost,
              },
            },
          },
          tx,
        );
      }

      await auditLogsRepository.create(
        {
          userId: session.id,
          action: "CREATE",
          entity: "STOCK",
          entityId: stock.id,
          metadata: {
            itemId: stock.itemId,
            locationId: stock.locationId,
            quantity: stock.quantity,
            type: stock.type,
            expiredAt: stock.expiredAt,
          },
        },
        tx,
      );

      return stock;
    });

    return {
      message: `Stock created successfully`,
      id: created.id,
    };
  },

  getById: async (
    session: Session["user"],
    stockId: string,
    params: StockGetByIdSchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const whereQuery = stockWhereInput({
      id: stockId,
    });

    const skipStockMovementData = (params.page - 1) * params.dataPerPage;
    const takeStockMovementData = params.dataPerPage;

    const selectData = stockSelectData({
      id: true,
      quantity: true,
      type: true,
      expiredAt: true,
      itemId: true,
      locationId: true,
      createdAt: true,
      updatedAt: true,
      item: {
        select: {
          id: true,
          name: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
        },
      },
      movements: {
        where: params.stockMovementType
          ? {
              type: params.stockMovementType,
            }
          : undefined,
        skip: skipStockMovementData,
        take: takeStockMovementData,
        orderBy: {
          [params.sortBy]: params.sortOrder,
        },
        select: {
          id: true,
          quantity: true,
          totalCost: true,
          type: true,
          reason: true,
          itemId: true,
          itemName: true,
          sourceLocationId: true,
          sourceLocation: {
            select: {
              id: true,
              name: true,
            },
          },
          destinationLocationId: true,
          destinationLocation: {
            select: {
              id: true,
              name: true,
            },
          },
          stockId: true,
          orderId: true,
          createdBy: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
    });

    const stock = await stockRepository.getById(whereQuery, selectData, prisma);

    if (!stock) throw notFound("Stock not found");

    const movementsCount = await stockMovementsRepository.countRows(
      {
        stockId: stockId,
        ...(params.stockMovementType ? { type: params.stockMovementType } : {}),
      },
      prisma,
    );

    return {
      message: "Stock retrieved successfully",
      data: {
        stock,
        movementsCount,
      },
    };
  },

  getMany: async (
    session: Session["user"],
    params: StockGetManySchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    let whereQuery: Prisma.StockWhereInput = {};

    if (params.searchQuery) {
      whereQuery.OR = [
        {
          item: {
            name: {
              contains: params.searchQuery,
              mode: "insensitive",
            },
          },
        },
        {
          location: {
            name: {
              contains: params.searchQuery,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    if (params.type && params.sortBy === "stockType") {
      whereQuery.type = params.type;
    }
    if (params.locationId) {
      whereQuery.locationId = params.locationId;
    }
    if (params.itemId) {
      whereQuery.itemId = params.itemId;
    }

    const selectData = stockSelectData({
      id: true,
      quantity: true,
      type: true,
      expiredAt: true,
      itemId: true,
      locationId: true,
      createdAt: true,
      updatedAt: true,
      item: {
        select: {
          id: true,
          name: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
    });

    const skip = (params.page - 1) * params.dataPerPage;
    const take = params.dataPerPage;

    const stocks = await stockRepository.getMany(
      whereQuery,
      selectData,
      skip,
      take,
      params.sortOrder,
      params.sortBy,
      prisma,
    );

    const totalCount = await prisma.stock.count({
      where: whereQuery,
    });

    return {
      message: "Stocks retrieved successfully",
      data: { stocks, totalCount },
    };
  },

  update: async (
    session: Session["user"],
    stockId: string,
    data: StockUpdateSchema,
    prisma: Prisma.TransactionClient | PrismaClient,
  ) => {
    const result = await prisma.$transaction(async (tx) => {
      const selectData = stockSelectData({
        quantity: true,
        type: true,
        expiredAt: true,
        locationId: true,
        itemId: true,
      });

      const existing = await stockRepository.getById(
        { id: stockId },
        selectData,
        tx,
      );
      if (!existing) throw notFound("Stock not found");

      // Check unique constraint if locationId or type is changing
      if (
        data.locationId !== existing.locationId ||
        data.type !== existing.type ||
        data.expiredAt !== existing.expiredAt
      ) {
        const existingConflict = await tx.stock.findFirst({
          where: {
            itemId: existing.itemId,
            locationId: data.locationId,
            type: data.type as StockType,
            expiredAt: data.expiredAt,
          },
        });

        const canBeUpdated = stockRules.checkCanUpdateStock(
          existingConflict?.id,
          stockId,
        );

        if (!canBeUpdated.allowed) {
          throw badRequest(canBeUpdated.reason);
        }
      }

      // Check if location exists
      const location = await locationRepository.findById(data.locationId, tx);
      if (!location) {
        throw notFound("Location not found");
      }

      const stock = await stockRepository.update(
        stockId,
        {
          type: data.type as StockType,
          expiredAt: data.expiredAt,
          location: {
            connect: {
              id: data.locationId,
            },
          },
        },
        tx,
      );

      await auditLogsRepository.create(
        {
          userId: session.id,
          action: "UPDATE",
          entity: "STOCK",
          entityId: stock.id,
          metadata: {
            id: stock.id,
            old: {
              quantity: existing.quantity,
              type: existing.type,
              expiredAt: existing.expiredAt,
              locationId: existing.locationId,
            },
            new: {
              quantity: stock.quantity,
              type: stock.type,
              expiredAt: stock.expiredAt,
              locationId: stock.locationId,
            },
          },
        },
        tx,
      );

      return stock;
    });

    return {
      message: `Stock updated successfully`,
      id: result.id,
    };
  },

  delete: async (
    session: Session["user"],
    stockId: string,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const result = await prisma.$transaction(async (tx) => {
      const selectData = stockSelectData({
        id: true,
        quantity: true,
        type: true,
        expiredAt: true,
        itemId: true,
        locationId: true,
        movements: {
          select: {
            id: true,
          },
          take: 1,
        },
        item: {
          select: {
            id: true,
          },
        },
      });

      const existing = await stockRepository.getById(
        { id: stockId },
        selectData,
        tx,
      );

      if (!existing) throw notFound("Stock not found");

      const deletionResult = stockRules.checkCanDeleteStock(existing.movements);

      if (!deletionResult.allowed) {
        throw badRequest(deletionResult.reason);
      }

      const stock = await stockRepository.delete(stockId, tx);

      await auditLogsRepository.create(
        {
          userId: session.id,
          action: "DELETE",
          entity: "STOCK",
          entityId: stock.id,
          metadata: {
            id: existing.id,
            itemId: existing.itemId,
            locationId: existing.locationId,
            quantity: existing.quantity,
            type: existing.type,
          },
        },
        tx,
      );

      return { stock, itemId: existing.itemId };
    });

    return {
      message: `Stock deleted successfully`,
      data: {
        itemId: result.itemId,
        stockId: result.stock.id,
      },
    };
  },
};

export default stockService;
