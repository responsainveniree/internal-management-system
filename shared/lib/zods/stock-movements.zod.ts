import z from "zod";
import {
  dataPerPage,
  page,
  sortOrderEnum,
  stockMovementSortByEnum,
  stockMovementTypeEnum,
} from "./general.zod";
import { MovementType } from "@prisma/client";

export const stockMovementCreateSchema = z
  .object({
    itemId: z.string().trim().min(1),
    stockId: z.string().trim().min(1).optional(),
    isGlobalStock: z.coerce.boolean().optional(),
    stockMovementType: stockMovementTypeEnum,
    quantity: z.number().int(),
    totalCost: z.number().int().optional(),
    reason: z.string().trim().min(10),
    destinationLocationId: z.string().trim().min(1).optional(),
    orderId: z.string().trim().min(1).optional(),
    expiredAt: z.coerce.date().optional(),
  })
  .superRefine((val, ctx) => {
    const TYPES_REQUIRING_DESTINATION: MovementType[] = ["TRANSFER"];

    if (TYPES_REQUIRING_DESTINATION.includes(val.stockMovementType)) {
      if (!val.destinationLocationId) {
        ctx.addIssue({
          code: "custom",
          message: "Destination location field must be filled",
          path: ["destinationLocationId"],
        });
      }
    }

    if (
      val.stockMovementType !== "ADJUSTMENT" &&
      val.quantity &&
      val.quantity < 1
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Quantity field must be greater than 0",
        path: ["quantity"],
      });
    }

    if (
      val.stockMovementType === "DISCARD" ||
      val.stockMovementType === "SALE" ||
      val.stockMovementType === "LAUNDRY_OUT"
    ) {
      if (!val.totalCost || val.totalCost < 1) {
        ctx.addIssue({
          code: "custom",
          message:
            "Total cost field must be filled or total cost must be greater than 0",
          path: ["totalCost"],
        });
      }
    }
  });

export type StockMovementCreateSchema = z.infer<
  typeof stockMovementCreateSchema
>;

export const stockQuickDiscardSchema = z.object({
  stockId: z.string().trim().min(1),
  quantity: z.number().int().nonnegative(),
  totalCost: z.number().int().nonnegative(),
  discardAs: z.enum(["DAMAGED", "EXPIRED", "LOST"]),
  reason: z.string().trim().min(10),
});

export type StockQuickDiscardSchema = z.infer<typeof stockQuickDiscardSchema>;

export const stockQuickLaundryOutSchema = z.object({
  stockId: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  totalCost: z.number().int().nonnegative(),

  reason: z.string().trim().min(10),
});

export type StockQuickLaundryOutSchema = z.infer<
  typeof stockQuickLaundryOutSchema
>;

export const stockMovementUpdateSchema = z.object({
  reason: z.string().trim().min(10),
});

export type StockMovementUpdateSchema = z.infer<
  typeof stockMovementUpdateSchema
>;

export const stockMovementGetManySchema = z.object({
  searchQuery: z.string().trim().min(3).optional(),
  sourceLocationId: z.string().trim().min(1).optional(),
  destinationLocationId: z.string().trim().min(1).optional(),
  page: page,
  dataPerPage: dataPerPage,
  sortOrder: sortOrderEnum.default("asc"),
  sortBy: stockMovementSortByEnum.default("createdAt"),
  type: stockMovementTypeEnum.optional(),
});

export type StockMovementGetManySchema = z.infer<
  typeof stockMovementGetManySchema
>;
