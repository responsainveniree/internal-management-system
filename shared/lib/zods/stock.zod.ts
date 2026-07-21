import z from "zod";
import {
  dataPerPage,
  page,
  sortOrderEnum,
  stockEnum,
  stockMovementTypeEnum,
  stockSortByEnum,
  stockSpecificSortByEnum,
} from "./general.zod";

export const stockCreateSchema = z
  .object({
    itemId: z.string().trim().min(1),
    quantity: z.number().min(1),
    totalCost: z.number().min(1).optional(),
    reason: z.string().trim().min(10),
    type: stockEnum,
    locationId: z.string().trim().min(1),
    expiredAt: z.coerce.date().optional(),
  })
  .superRefine(({ totalCost, reason, type }, ctx) => {
    if (totalCost == null && type === "READY") {
      ctx.addIssue({
        code: "invalid_value" as any,
        path: ["totalCost"],
        message: "Total cost is required is filled",
      });
    }

    if (!reason) {
      ctx.addIssue({
        code: "invalid_value" as any,
        path: ["reason"],
        message: "Reason is required when quantity is filled",
      });
    }
  });

export type StockCreateSchema = z.infer<typeof stockCreateSchema>;

export const stockGetManySchema = z.object({
  searchQuery: z.string().trim().min(3).optional(),
  page: page,
  dataPerPage: dataPerPage,
  sortOrder: sortOrderEnum,
  sortBy: stockSortByEnum.default("createdAt"),
  type: stockEnum.optional(),
  locationId: z.string().optional(),
  itemId: z.string().optional(),
});

export type StockGetManySchema = z.infer<typeof stockGetManySchema>;

export const stockGetByIdSchema = z.object({
  page: page,
  dataPerPage: dataPerPage,
  sortOrder: sortOrderEnum,
  sortBy: stockSpecificSortByEnum.default("createdAt"),
  stockMovementType: stockMovementTypeEnum.optional(),
});

export type StockGetByIdSchema = z.infer<typeof stockGetByIdSchema>;

export const stockUpdateSchema = z.object({
  type: stockEnum,
  locationId: z.string().trim().min(1),
  expiredAt: z.coerce.date().optional(),
});

export type StockUpdateSchema = z.infer<typeof stockUpdateSchema>;
