import { badRequest } from "@/shared/lib/error-handlers";
import {
  ItemCreateSchema,
  ItemGetByIdSchema,
  ItemGetManySchema,
  ItemUpdateSchema,
} from "@/shared/lib/zods/item.zod";
import itemRepository, {
  createIncludeItemData,
  createSelectItemData,
} from "./item.repository";
import auditLogsRepository from "../audit-logs/audit-log.repository";
import { EXPIRING_WINDOW_DAYS } from "./item.utils";
import { MovementType, Prisma, PrismaClient } from "@prisma/client";
import { stockRepository } from "../stocks/stock.repository";
import stockMovementsRepository from "../stock-movements/stock-movements.repository";
import { Session } from "next-auth";

const itemService = {
  create: async (
    session: Session["user"],
    data: ItemCreateSchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const result = await prisma.$transaction(async (tx) => {
      const item = await itemRepository.create(session.id, data, tx);

      await auditLogsRepository.create(
        {
          userId: session.id,
          action: "CREATE",
          entity: "ITEM",
          entityId: item.id,
          metadata: {
            name: item.name,
            categoryId: item.categoryId,
            locationId: data.locationId,
            sellingPrice: item.sellingPrice,
            initialStock: data.stock?.quantity ?? 0,
          },
        },
        tx,
      );

      return item;
    });

    return {
      message: `${result.name} created successfully`,
      id: result.id,
    };
  },

  getMany: async (
    session: Session["user"],
    params: ItemGetManySchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const whereClause = itemRepository.buildWhereClause(
      params.findBy ? params.findBy : null,
      params.categoryId ? params.categoryId : null,
      params.search,
    );

    // Pagination
    const skip = (params.page - 1) * params.dataPerPage;

    const take = params.dataPerPage;

    const includeQuery = createIncludeItemData({
      category: { select: { id: true, name: true } },
    });

    const [items, totalItems] = await Promise.all([
      await itemRepository.getManyInclude(
        whereClause,
        includeQuery,
        skip,
        take,
        params.sortBy,
        params.orderBy,
        prisma,
      ),
      await itemRepository.countItems(whereClause, prisma),
    ]);

    return {
      message: `Item data retrieved successfully`,
      data: {
        items,
        totalItems,
      },
    };
  },

  getById: async (
    session: Session["user"],
    itemId: string,
    params: ItemGetByIdSchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const today = new Date();
    const expiringWindow = new Date();
    expiringWindow.setDate(expiringWindow.getDate() + EXPIRING_WINDOW_DAYS);

    const stockWhereClause = stockRepository.buildStockWhereClause(null, {
      sortBy: params.sortBy,
      itemSearchQuery: null,
      stockStatusType: params.status,
    });

    stockWhereClause.itemId = itemId;

    const skipItemStocks =
      (params.itemStockPage - 1) * params.itemStocksPerpage;

    const takeItemStocksPerPage = params.itemStocksPerpage;

    const itemSelectField = createSelectItemData({
      id: true,
      name: true,
      updatedAt: true,
      userCreatedBy: { select: { name: true } },
      userUpdatedBy: { select: { name: true } },
      minThreshold: true,
      description: true,
      image: true,
      category: true,
      sellingPrice: true,
      isActive: true,
      createdAt: true,
      createdBy: true,
      updatedBy: true,
    });

    const stockSelectField: Prisma.StockSelect = {
      id: true,
      item: {
        select: {
          name: true,
          id: true,
        },
      },
      quantity: true,
      type: true,
      updatedAt: true,
      expiredAt: true,
      location: {
        select: {
          id: true,
          name: true,
        },
      },
    };

    const item = await itemRepository.getById(
      itemId,
      itemSelectField,
      stockWhereClause,
      stockSelectField,
      skipItemStocks,
      takeItemStocksPerPage,
      params.sortBy,
      params.orderBy,
      prisma,
    );

    // Count the row
    const itemStockCount = await stockRepository.countRows(
      stockWhereClause,
      prisma,
    );

    const stockGroups = await stockRepository.getGroupedStockQuantities(
      "type",
      itemId,
      prisma,
    );

    const stockCounts = stockGroups.reduce(
      (acc, group) => {
        acc[group.type] = group._sum.quantity || 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    const [totalReadyStock, totalUnlocatedItems, totalDiscardedItems] =
      await Promise.all([
        // Special condition for READY stock that checks expiration dates
        stockRepository.countQuantity(
          {
            itemId: itemId,
            type: "READY",
            OR: [{ expiredAt: null }, { expiredAt: { gte: today } }],
          },
          prisma,
        ),

        stockMovementsRepository.countQuantity(
          {
            stockId: null,
            itemId: item?.id,
            destinationLocationId: null,
            sourceLocationId: null,
          },
          prisma,
        ),

        // Querying a specific movement type
        stockMovementsRepository.countQuantity(
          { type: "DISCARD", itemId: itemId },
          prisma,
        ),
      ]);

    const unlocatedItem = await stockMovementsRepository.countQuantity(
      {
        stockId: null,
        itemId: item?.id,
        destinationLocationId: null,
        sourceLocationId: null,
      },
      prisma,
    );

    const totalExpiredStock = stockCounts["EXPIRED"] || 0;
    const totalDamagedStock = stockCounts["DAMAGED"] || 0;
    const totalDirtyStock = stockCounts["DIRTY"] || 0;
    const totalLostStock = stockCounts["LOST"] || 0;

    // totalLocatedItems is everything that is NOT lost
    // You can sum your cached object directly without an extra DB call!
    const totalLocatedItems = Object.entries(stockCounts)
      .filter(([type]) => type !== "LOST")
      .reduce((sum, [_, quantity]) => sum + quantity, 0);

    const isStockLow =
      item && totalReadyStock && totalReadyStock <= item?.minThreshold
        ? true
        : false;

    return {
      message: "Item retrieved successfully",
      data: {
        item: {
          ...item,
          stocks:
            item?.stocks.length && item?.stocks.length > 0 ? item?.stocks : [],
          isStockLow: isStockLow ? "Low in stock" : "-",
        },
        totalLocatedItemQuantity: totalLocatedItems,
        unlocatedItem: {
          type: "RECEIVE" as MovementType,
          quantity: totalUnlocatedItems,
        },
        totalUnlocatedItemQuantity: unlocatedItem ?? 0,
        totalDiscardedItems: totalDiscardedItems,
        totalDamagedStock,
        totalReadyStock,
        totalDirtyStock,
        totalExpiredStock,
        totalLostStock,
        itemStockCount,
      },
    };
  },

  update: async (
    session: Session["user"],
    itemId: string,
    data: ItemUpdateSchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const result = await prisma.$transaction(async (tx) => {
      const item = await itemRepository.update(session.id, itemId, data, tx);

      await auditLogsRepository.create(
        {
          userId: session.id,
          action: "UPDATE",
          entity: "ITEM",
          entityId: item.id,
          metadata: {
            name: item.name,
            categoryId: item.categoryId,
            sellingPrice: item.sellingPrice,
          },
        },
        tx,
      );

      return item;
    });

    return {
      message: `${result.name} updated successfully`,
      id: result.id,
    };
  },

  delete: async (
    session: Session["user"],
    itemId: string,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const result = await prisma.$transaction(async (tx) => {
      const item = await itemRepository.findById(itemId, prisma);

      if (item?.isActive) {
        throw badRequest(
          "You cannot delete an active item. Please deactivate it first.",
        );
      }

      const deletedItem = await itemRepository.delete(itemId, tx);

      await auditLogsRepository.create(
        {
          userId: session.id,
          action: "DELETE",
          entity: "ITEM",
          entityId: deletedItem.id,
          metadata: {
            name: deletedItem.name,
          },
        },
        tx,
      );

      return deletedItem;
    });

    return {
      message: `${result.name} deleted successfully`,
      id: result.id,
    };
  },
};

export default itemService;
