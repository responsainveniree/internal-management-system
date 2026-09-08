import {
  StockRequestFilterSchema,
  StockRequestReviewSchema,
} from "@/shared/lib/zods/stock-request.zod";
import { Prisma, PrismaClient } from "@prisma/client";
import { Session } from "next-auth";
import { requesterRoles } from "./stock-request.types";

export const createStockRequestSelect = <T extends Prisma.StockRequestSelect>(
  select: T,
): T => select;

export const createStockRequestWhereQuery = (
  session: Session["user"],
  baseFilter: StockRequestFilterSchema,
): Prisma.StockRequestWhereInput => {
  const where: Prisma.StockRequestWhereInput = {};

  if (requesterRoles.includes(session.role)) {
    where.requestedById = session.id;
  }

  // Filtering by search keyword (minimum 3 characters)
  if (baseFilter.search && baseFilter.search.trim().length >= 3) {
    where.OR = [
      {
        item: {
          name: {
            contains: baseFilter.search.trim(),
            mode: "insensitive",
          },
        },
      },
    ];
  }

  // Filtering by request type and status
  if (baseFilter.type) where.type = baseFilter.type;
  if (baseFilter.status) where.status = baseFilter.status;

  // Filtering by location IDs
  if (baseFilter.destinationLocationId) {
    where.destinationLocationId = baseFilter.destinationLocationId;
  }
  if (baseFilter.sourceLocationId) {
    where.sourceLocationId = baseFilter.sourceLocationId;
  }

  return where;
};

export const createStockRequestOrderByQuery = (
  sortBy: StockRequestFilterSchema["sortBy"],
  sortOrder: StockRequestFilterSchema["sortOrder"],
): Prisma.StockRequestOrderByWithRelationInput => {
  // Mapping nested relational fields vs scalar fields for sorting
  switch (sortBy) {
    case "itemName":
      return { item: { name: sortOrder } };
    case "sourceLocation":
      return { sourceLocation: { name: sortOrder } };
    case "destinationLocation":
      return { destinationLocation: { name: sortOrder } };
    default:
      return { [sortBy]: sortOrder };
  }
};

export const stockRequestRepository = {
  findById: async (
    stockRequestId: string,
    tx: Prisma.TransactionClient | PrismaClient,
  ) => {
    return await tx.stockRequest.findUnique({
      where: {
        id: stockRequestId,
      },
    });
  },

  create: async (
    data: Prisma.StockRequestCreateInput,
    tx: Prisma.TransactionClient | PrismaClient,
  ) => {
    return await tx.stockRequest.create({
      data,
    });
  },

  update: async (
    stockRequestId: string,
    data: Prisma.StockRequestUncheckedUpdateInput,
    tx: Prisma.TransactionClient | PrismaClient,
  ) => {
    return await tx.stockRequest.update({
      where: {
        id: stockRequestId,
      },
      data,
    });
  },

  review: async (
    userId: string,
    stockRequestId: string,
    data: StockRequestReviewSchema,
    tx: Prisma.TransactionClient | PrismaClient,
  ) => {
    return await tx.stockRequest.update({
      where: {
        id: stockRequestId,
      },
      data: {
        status: data.stockRequestStatus,
        approvedBy: {
          connect: { id: userId },
        },
        decisionNotes: data.decisitonNotes,
        approvedQuantity: data.approvedQuantity,
      },
    });
  },

  getMany: async (
    where: Prisma.StockRequestWhereInput,
    select: Prisma.StockRequestSelect,
    orderBy: Prisma.StockRequestOrderByWithRelationInput,
    skip: number,
    take: number,
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    return tx.stockRequest.findMany({
      where,
      select,
      orderBy,
      skip,
      take,
    });
  },

  getById: async (
    stockRequestId: string,
    select: Prisma.StockRequestSelect,
    tx: Prisma.TransactionClient | PrismaClient,
  ) => {
    return await tx.stockRequest.findUnique({
      where: {
        id: stockRequestId,
      },
      select,
    });
  },

  delete: async (
    stockRequestId: string,
    tx: Prisma.TransactionClient | PrismaClient,
  ) => {
    return await tx.stockRequest.delete({
      where: {
        id: stockRequestId,
      },
    });
  },

  countRows: async (
    where: Prisma.StockRequestWhereInput,
    tx: PrismaClient | Prisma.TransactionClient,
  ) => {
    return tx.stockRequest.count({
      where,
    });
  },
};
