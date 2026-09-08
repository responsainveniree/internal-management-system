import {
  StockRequestCreateSchema,
  StockRequestFilterSchema,
  StockRequestReviewSchema,
  StockRequestUpdateSchema,
} from "@/shared/lib/zods/stock-request.zod";
import { MovementType, Prisma, PrismaClient } from "@prisma/client";
import { Session } from "next-auth";
import itemRepository from "../items/item.repository";
import { locationRepository } from "../locations/location.repository";
import { badRequest, notFound } from "@/shared/lib/error-handlers";

import { sendPushToUser } from "@/shared/lib/push";
import { stockRepository } from "../stocks/stock.repository";
import {
  createStockRequestOrderByQuery,
  createStockRequestSelect,
  createStockRequestWhereQuery,
  stockRequestRepository,
} from "./stock-request.repository";
import stockMovementsService from "../stock-movements/stock-movements.service";
import auditLogsRepository from "../audit-logs/audit-log.repository";
import {
  assertCanCreateStockRequest,
  assertCanDeleteStockRequest,
  assertCanReviewStockRequest,
  assertCanUpdateStockRequest,
} from "./stock-request.rules";

const stockRequestService = {
  create: async (
    session: Session["user"],
    data: StockRequestCreateSchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const [item, stock, destinationLocation, totalReadyStocks] =
      await Promise.all([
        itemRepository.findById(data.itemId, prisma),
        stockRepository.findById(data.stockId, prisma),
        locationRepository.findById(data.destinationLocationId, prisma),
        stockRepository.aggregate(
          { itemId: data.itemId, type: "READY" },
          { quantity: true },
          prisma,
        ),
      ]);

    assertCanCreateStockRequest(
      item,
      stock,
      destinationLocation,
      totalReadyStocks?.quantity,
      data.quantity,
    );

    const createdStockRequest = await prisma.$transaction(async (tx) => {
      const stockRequest = await stockRequestRepository.create(
        {
          item: { connect: { id: data.itemId } },
          requestedQuantity: data.quantity,
          sourceLocation: { connect: { id: stock!.locationId } },
          destinationLocation: {
            connect: { id: data.destinationLocationId },
          },
          type: data.requestType,
          reason: data.reason,
          requestedBy: { connect: { id: session.id } },
        },
        tx,
      );

      await auditLogsRepository.create(
        {
          entity: "STOCK_REQUEST",
          action: "CREATE",
          entityId: stockRequest.id,
          metadata: {
            itemId: stockRequest.itemId,
            quantity: stockRequest.requestedQuantity,
            sourceLocationId: stockRequest.sourceLocationId,
            destinationLocationId: stockRequest.destinationLocationId,
            requestType: stockRequest.type,
            reason: stockRequest.reason,
          },
          userId: session.id,
        },
        tx,
      );

      return stockRequest;
    });

    sendPushToUser(null, ["HOTEL_MANAGER", "SUPERVISOR"], {
      title: "New Stock Request",
      body: `${session.name} has submitted a new stock request.`,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/stock-requests`,
    });

    return {
      message: "Stock request created successfully",
      data: {
        id: createdStockRequest.id,
      },
    };
  },

  update: async (
    session: Session["user"],
    stockRequestId: string,
    data: StockRequestUpdateSchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const [stock, destinationLocation, stockRequest] = await Promise.all([
      data.stockId ? stockRepository.findById(data.stockId, prisma) : null,
      locationRepository.findById(data.destinationLocationId, prisma),
      stockRequestRepository.findById(stockRequestId, prisma),
    ]);

    const totalActiveReadyStock = await stockRepository.aggregate(
      {
        itemId: stockRequest?.itemId,
      },
      { quantity: true },
      prisma,
    );

    assertCanUpdateStockRequest(
      data,
      stockRequest,
      stock,
      destinationLocation,
      totalActiveReadyStock.quantity,
    );

    const transaction = await prisma.$transaction(async (tx) => {
      const updatedStockRequest = await stockRequestRepository.update(
        stockRequestId,
        {
          destinationLocationId: destinationLocation!.id,
          sourceLocationId: stock!.locationId,
          type: data.type,
          requestedQuantity: data.requestedQuantity,
        },
        tx,
      );

      await auditLogsRepository.create(
        {
          entity: "STOCK_REQUEST",
          action: "UPDATE",
          entityId: updatedStockRequest.id,
          metadata: {
            stockRequestId: updatedStockRequest.id,
            quantity: updatedStockRequest.requestedQuantity,
            sourceLocationId: updatedStockRequest.sourceLocationId,
            destinationLocationId: updatedStockRequest.destinationLocationId,
            requestType: updatedStockRequest.type,
            reason: updatedStockRequest.reason,
          },
          userId: session.id,
        },
        tx,
      );

      return {
        updatedStockRequest,
      };
    });

    return {
      message: `Stock request updated successfully`,
      stockRequestId: transaction.updatedStockRequest.id,
    };
  },

  review: async (
    session: Session["user"],
    stockRequestId: string,
    data: StockRequestReviewSchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const stockRequest = await stockRequestRepository.findById(
      stockRequestId,
      prisma,
    );

    const totalActiveReadyStock = await stockRepository.aggregate(
      {
        itemId: stockRequest?.itemId,
      },
      { quantity: true },
      prisma,
    );

    assertCanReviewStockRequest(
      data,
      stockRequest,
      totalActiveReadyStock.quantity,
    );

    const transaction = await prisma.$transaction(async (tx) => {
      const reviewedStockRequest = await stockRequestRepository.review(
        session.id,
        stockRequestId,
        {
          ...data,
          stockRequestStatus:
            data.approvedQuantity < stockRequest!.requestedQuantity
              ? "PARTIALLY_APPROVED"
              : data.stockRequestStatus,
        },
        tx,
      );

      let stockMovementType: MovementType;

      switch (stockRequest?.type) {
        case "ISSUE":
          stockMovementType = "CONSUME";
          break;
        case "RESTOCK":
          stockMovementType = "RECEIVE";
          break;
        case "SALE":
          stockMovementType = "SALE";
          break;
        case "TRANSFER":
          stockMovementType = "TRANSFER";
          break;
        case "REPORT_LOST":
          stockMovementType = "MARK_AS_LOST";
          break;
        case "WRITE_OFF":
          stockMovementType = data.writeOffTypeDecision as MovementType;
          break;
        case "LAUNDRY_IN":
          stockMovementType = "LAUNDRY_IN";
          break;
        case "LAUNDRY_OUT":
          stockMovementType = "LAUNDRY_OUT";
          break;
        default:
          throw badRequest("Invalid stock request type");
      }

      const stock = await stockRepository.findFirst(
        {
          itemId: stockRequest.itemId,
          locationId: stockRequest.sourceLocationId
            ? stockRequest.sourceLocationId
            : stockRequest.destinationLocationId,
        },
        tx,
      );

      await stockMovementsService.create(
        session,
        {
          itemId: stockRequest.itemId,
          quantity: data.approvedQuantity,
          reason: data.stockMovementReason,
          stockMovementType,
          destinationLocationId: stockRequest.destinationLocationId,
          stockId: stock?.id,
          isGlobalStock: stockRequest.sourceLocationId === null,
        },
        tx,
      );

      sendPushToUser(reviewedStockRequest.requestedById, null, {
        title: "Stock Request Reviewed",
        body: `Your stock request has been ${data.stockRequestStatus.toLowerCase()}.`,
        url: process.env.NEXT_PUBLIC_BASE_URL!,
      });

      await auditLogsRepository.create(
        {
          entity: "STOCK_REQUEST",
          action: "CREATE",
          entityId: reviewedStockRequest.id,
          metadata: {
            itemId: reviewedStockRequest.itemId,
            quantity: reviewedStockRequest.requestedQuantity,
            sourceLocationId: reviewedStockRequest.sourceLocationId,
            destinationLocationId: reviewedStockRequest.destinationLocationId,
            requestType: reviewedStockRequest.type,
            reason: reviewedStockRequest.reason,
          },
          userId: session.id,
        },
        tx,
      );

      return {
        reviewedStockRequest,
      };
    });

    return {
      message: "Stock request reviewed successfully",
      stockRequestId: transaction.reviewedStockRequest.id,
    };
  },

  getMany: async (
    session: Session["user"],
    filters: StockRequestFilterSchema,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const where = createStockRequestWhereQuery(session, filters);
    const orderBy = createStockRequestOrderByQuery(
      filters.sortBy,
      filters.sortOrder,
    );

    const select = createStockRequestSelect({
      id: true,
      approvedBy: { select: { id: true, name: true } },
      requestedBy: { select: { id: true, name: true } },
      createdAt: true,
      updatedAt: true,
      item: { select: { id: true, name: true } },
      type: true,
      status: true,
      destinationLocation: { select: { id: true, name: true } },
      sourceLocation: { select: { id: true, name: true } },
      decisionNotes: true,
      requestedQuantity: true,
      approvedQuantity: true,
    });

    const take = filters.dataPerPage;
    const skip = (filters.page - 1) * take;

    const [stockRequests, totalStockRequests] = await Promise.all([
      stockRequestRepository.getMany(
        where,
        select,
        orderBy,
        skip,
        take,
        prisma,
      ),
      stockRequestRepository.countRows(where, prisma),
    ]);

    return {
      message: "Stock requests successfully retrieved",
      data: { stockRequests, totalStockRequests: totalStockRequests },
    };
  },

  getById: async (
    session: Session["user"],
    stockRequestId: string,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const select = createStockRequestSelect({
      id: true,
      approvedBy: { select: { id: true, name: true } },
      requestedBy: { select: { id: true, name: true } },
      createdAt: true,
      updatedAt: true,
      item: { select: { id: true, name: true } },
      type: true,
      status: true,
      destinationLocation: { select: { id: true, name: true } },
      sourceLocation: { select: { id: true, name: true } },
      decisionNotes: true,
      requestedQuantity: true,
      approvedQuantity: true,
    });

    const stockRequest = await stockRequestRepository.getById(
      stockRequestId,
      select,
      prisma,
    );

    if (!stockRequest) throw notFound("Stock request not found");

    return {
      message: "Stock request retrieved successfully",
      stockRequest,
    };
  },

  delete: async (
    session: Session["user"],
    stockRequestId: string,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) => {
    const stockRequest = await stockRequestRepository.findById(
      stockRequestId,
      prisma,
    );

    if (!stockRequest) throw badRequest("Stock request not found.");

    assertCanDeleteStockRequest(session, stockRequest);

    const transaction = await prisma.$transaction(async (tx) => {
      const deletedStockRequest = await stockRequestRepository.delete(
        stockRequestId,
        prisma,
      );

      await auditLogsRepository.create(
        {
          entity: "STOCK_REQUEST",
          action: "DELETE",
          entityId: deletedStockRequest.id,
          metadata: {
            itemId: deletedStockRequest.itemId,
            quantity: deletedStockRequest.requestedQuantity,
            sourceLocationId: deletedStockRequest.sourceLocationId,
            destinationLocationId: deletedStockRequest.destinationLocationId,
            requestType: deletedStockRequest.type,
            reason: deletedStockRequest.reason,
          },
          userId: session.id,
        },
        tx,
      );

      return { deletedStockRequest };
    });

    return {
      message: "Stock request deleted successfully.",
      data: {
        id: transaction.deletedStockRequest.id,
      },
    };
  },
};

export default stockRequestService;
