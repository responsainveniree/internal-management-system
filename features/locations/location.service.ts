import { badRequest, notFound } from "@/shared/lib/error-handlers";
import {
  LocationCreateSchema,
  LocationGetByIdSchema,
  LocationGetManySchema,
  LocationUpdateSchema,
} from "@/shared/lib/zods/location.zod";
import auditLogsRepository from "../audit-logs/audit-log.repository";
import { locationRepository, locationSelectData } from "./location.repository";
import { PrismaClient } from "@prisma/client";
import { Session } from "next-auth";
import { stockRepository } from "../stocks/stock.repository";
import locationRules from "./location.rule";

const locationService = {
  create: async (
    session: Session["user"],
    data: LocationCreateSchema,
    prisma: PrismaClient,
  ) => {
    const created = await prisma.$transaction(async (tx) => {
      const location = await locationRepository.create(
        {
          name: data.name,
          type: data.type,
          description: data.description,
          userCreatedBy: {
            connect: {
              id: session.id,
            },
          },
        },
        tx,
      );

      await auditLogsRepository.create(
        {
          userId: session.id,
          action: "CREATE",
          entity: "LOCATION",
          entityId: location.id,
          metadata: {
            name: location.name,
            type: location.type,
            description: location.description,
          },
        },
        tx,
      );

      return location;
    });

    return {
      message: `${created.name} created successfully`,
      id: created.id,
    };
  },

  getById: async (
    session: Session["user"],
    locationId: string,
    params: LocationGetByIdSchema,
    prisma: PrismaClient,
  ) => {
    const stockWhereClause = stockRepository.buildStockWhereClause(
      locationId,
      params,
    );

    const skip = (params.itemPage - 1) * params.itemDataPerPage;
    const take = params.itemDataPerPage;

    const selectData = locationSelectData({
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      description: true,
      type: true,
      userCreatedBy: { select: { name: true } },
      userUpdatedBy: { select: { name: true } },
      stocks: {
        select: {
          item: { select: { name: true } },
          quantity: true,
          type: true,
        },
        where: stockWhereClause,
        // if the sortBy is stockType, we need to sort by quantity instead of item.name
        orderBy: [
          ...(params.sortBy === "stockType"
            ? [{ quantity: params.sortOrder }]
            : []),
          ...(params.sortBy === "name"
            ? [{ item: { name: params.sortOrder } }]
            : []),
        ],
        skip,
        take,
      },
    });

    const location = await locationRepository.get(
      { id: locationId },
      selectData,
      prisma,
    );

    if (!location) throw notFound("Location not found");

    const stockCountWhereClause = stockRepository.buildStockCountWhereClause(
      stockWhereClause,
      params.itemSearchQuery,
    );

    const totalStocksCount = await stockRepository.countRows(
      {
        ...stockCountWhereClause,
      },
      prisma,
    );

    return {
      message: "Location retrieved successfully",
      data: { location, totalStocks: totalStocksCount },
    };
  },

  getMany: async (
    session: Session["user"],
    params: LocationGetManySchema,
    prisma: PrismaClient,
  ) => {
    const whereQuery = locationRepository.buildLocationWhereClause(params);

    const selectData = locationSelectData({
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      description: true,
      type: true,
      userCreatedBy: {
        select: {
          name: true,
        },
      },
      userUpdatedBy: {
        select: {
          name: true,
        },
      },
    });

    const skip = (params.page - 1) * params.dataPerPage;
    const take = params.dataPerPage;

    const locations = await locationRepository.getMany(
      whereQuery,
      selectData,
      skip,
      take,
      params.sortOrderEnum,
      params.sortBy,
      prisma,
    );

    const totalCount = await prisma.location.count({
      where: whereQuery,
    });

    return {
      message: "Locations retrieved successfully",
      data: { locations, totalCount },
    };
  },

  update: async (
    session: Session["user"],
    locationId: string,
    data: LocationUpdateSchema,
    prisma: PrismaClient,
  ) => {
    const updated = await prisma.$transaction(async (tx) => {
      const selectData = locationSelectData({
        name: true,
        type: true,
        description: true,
      });

      const existing = await locationRepository.get(
        { id: locationId },
        selectData,
        tx,
      );
      if (!existing) throw notFound("Location not found");

      const location = await locationRepository.update(
        locationId,
        {
          name: data.name,
          type: data.type,
          description: data.description,
          userCreatedBy: {
            connect: {
              id: session.id,
            },
          },
        },
        tx,
      );

      await auditLogsRepository.create(
        {
          userId: session.id,
          action: "UPDATE",
          entity: "LOCATION",
          entityId: location.id,
          metadata: {
            id: location.id,
            old: {
              name: existing.name,
              type: existing.type,
              description: existing.description,
            },
            new: {
              name: location.name,
              type: location.type,
              description: location.description,
            },
          },
        },
        tx,
      );

      return location;
    });

    return {
      message: `${updated.name} updated successfully`,
      id: updated.id,
    };
  },

  delete: async (
    session: Session["user"],
    locationId: string,
    prisma: PrismaClient,
  ) => {
    const deleted = await prisma.$transaction(async (tx) => {
      const selectData = locationSelectData({
        id: true,
        name: true,
        type: true,
        description: true,
        stocks: {
          select: {
            id: true,
          },
          take: 1,
        },
      });

      const existing = await locationRepository.get(
        { id: locationId },
        selectData,
        tx,
      );

      if (!existing) {
        throw notFound("Location not found");
      }

      const deletionResult = locationRules.canDeleteLocation({
        stocks: existing?.stocks || [],
      });

      if (!deletionResult.allowed) {
        if (deletionResult.reason) throw badRequest(deletionResult.reason);

        throw badRequest();
      }

      const location = await locationRepository.delete(locationId, tx);

      await auditLogsRepository.create(
        {
          userId: session.id,
          action: "DELETE",
          entity: "LOCATION",
          entityId: location.id,
          metadata: {
            id: existing?.id,
            name: existing?.name,
            type: existing?.type,
            description: existing?.description,
          },
        },
        tx,
      );

      return location;
    });

    return {
      message: `${deleted.name} deleted successfully`,
      id: deleted.id,
    };
  },
};

export default locationService;
