import {
  ItemCreateSchema,
  ItemGetByIdSchema,
  ItemUpdateSchema,
} from "@/shared/lib/zods/item.zod";
import { Prisma, PrismaClient } from "@prisma/client";
import { filterItemBy } from "./item.types";

export const createSelectItemData = <T extends Prisma.ItemSelect>(
  select: T,
): T => select;

export const createIncludeItemData = <T extends Prisma.ItemSelect>(
  select: T,
): T => select;

const itemRepository = {
  // it's still for search query
  buildWhereClause: (
    filterBy: filterItemBy,
    filterValue: string | null,
    searchQuery?: string,
  ): Prisma.ItemWhereInput => {
    const whereClause: Prisma.ItemWhereInput = {};

    // If both the filter criteria and the filter value exist
    if (filterBy && filterValue) {
      if (filterBy === "category") {
        whereClause.categoryId = filterValue;
      }
    }

    if (searchQuery && searchQuery.trim().length >= 3) {
      whereClause.name = {
        contains: searchQuery.trim(),
        mode: "insensitive",
      };
    }

    return whereClause;
  },

  create: async (
    userId: string,
    data: ItemCreateSchema,
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    const item = await tx.item.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        image: data.image,
        sellingPrice: data.sellingPrice ? data.sellingPrice : undefined,
        attributes: data.attributes,
        minThreshold: data.minThreshold ? data.minThreshold : undefined,
        createdBy: userId,
      },
    });

    if (data.stock?.quantity) {
      const stock = await tx.stock.create({
        data: {
          quantity: data.stock?.quantity,
          type: "READY",
          createdBy: userId,
          locationId: data.locationId,
          expiredAt: data.stock?.expiredAt ? data.stock.expiredAt : undefined,
          itemId: item.id,
        },
      });

      await tx.stockMovement.create({
        data: {
          itemId: item.id,
          stockId: stock.id,
          itemName: item.name,
          quantity: data.stock?.quantity ? data.stock.quantity : 0,
          totalCost: data.stock?.totalCost ? data.stock.totalCost : 0,
          reason: data.stock.reason ?? "Initial",
          type: "RECEIVE",
          createdBy: userId,
          destinationLocationId: data.locationId,
          sourceLocationId: null,
        },
      });
    }

    return item;
  },

  findById: async (id: string, tx: PrismaClient | Prisma.TransactionClient) => {
    return await tx.item.findUnique({
      where: { id },
    });
  },

  getById: async (
    itemId: string,
    itemSelect: Prisma.ItemSelect,
    stockWhereClause: Prisma.StockWhereInput,
    stockSelectData: Prisma.StockSelect,
    skipStockData: number | undefined,
    takeStockData: number | undefined,
    sortBy: ItemGetByIdSchema["sortBy"],
    orderBy: "asc" | "desc",
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    return await tx.item.findUnique({
      where: { id: itemId },
      select: {
        ...itemSelect,
        stocks: {
          where: stockWhereClause,
          select: stockSelectData,
          skip: skipStockData,
          take: takeStockData,
          ...(sortBy !== "stockType"
            ? {
                orderBy: {
                  [sortBy]: orderBy,
                },
              }
            : {
                orderBy: {
                  quantity: orderBy,
                },
              }),
        },
      },
    });
  },

  getManyInclude: async <T extends Prisma.ItemInclude>(
    where: Prisma.ItemWhereInput,
    include: Prisma.Subset<T, Prisma.ItemInclude>,
    skip: number | undefined,
    take: number | undefined,
    sortBy: string,
    orderBy: "asc" | "desc",
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    return await tx.item.findMany({
      where,
      include,
      skip,
      take,
      orderBy: {
        [sortBy]: orderBy,
      },
    });
  },

  countItems: async (
    where: Prisma.ItemWhereInput,
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    return await tx.item.count({
      where,
    });
  },

  update: async (
    userId: string,
    itemId: string,
    data: ItemUpdateSchema,
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    return await tx.item.update({
      where: { id: itemId },
      data: {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        image: data.image,
        sellingPrice: data.sellingPrice ? data.sellingPrice : undefined,
        attributes: data.attributes,
        updatedBy: userId,
        minThreshold: data.minThreshold ? data.minThreshold : undefined,
        isActive: data.isActive,
      },
    });
  },

  delete: async (
    itemId: string,
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    return await tx.item.delete({
      where: { id: itemId },
    });
  },
};

export default itemRepository;
