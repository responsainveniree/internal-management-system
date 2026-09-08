import z from "zod";
import {
  dataPerPage,
  page,
  sortOrderEnum,
  stockRequestSortByEnum,
  stockRequestStatusEnum,
  stockRequestTypeEnum,
  writeOffTypeDecisionEnum,
} from "./general.zod";
import { StockRequestType } from "@prisma/client";

export const stockRequestCreateSchema = z.object({
  itemId: z.string().trim().min(1),
  quantity: z.number().min(1),
  reason: z.string().min(10),
  stockId: z.string().trim().min(1),
  destinationLocationId: z.string().trim().min(1),
  requestType: stockRequestTypeEnum,
});

export type StockRequestCreateSchema = z.infer<typeof stockRequestCreateSchema>;

export const stockRequestReviewSchema = z
  .object({
    stockRequestStatus: stockRequestStatusEnum,
    stockRequestType: stockRequestTypeEnum,
    writeOffTypeDecision: writeOffTypeDecisionEnum,
    approvedQuantity: z.number().min(0),
    decisitonNotes: z.string().max(100).optional(),
    stockMovementReason: z.string().trim().min(10),
  })
  .superRefine((val, ctx) => {
    if (val.stockRequestStatus === "PENDING") {
      ctx.addIssue({
        code: "custom",
        message: "Status can't remain 'Pending'. You must change it",
        path: ["stockRequestStatus"],
      });
    }

    if (val.stockRequestType === "WRITE_OFF") {
      if (!val.writeOffTypeDecision) {
        ctx.addIssue({
          code: "custom",
          message: "Write off type decision is required for write off requests",
        });
      }
    }
  });

export type StockRequestReviewSchema = z.infer<typeof stockRequestReviewSchema>;

export const stockRequestUpdateSchema = z
  .object({
    type: stockRequestTypeEnum,
    requestedQuantity: z.number().min(1),
    stockId: z.string().trim().min(1).optional(),
    destinationLocationId: z.string().trim().min(1),
  })
  .superRefine((val, ctx) => {
    const requiredSourceLocationTypes = [
      "ISSUE",
      "LAUNDRY_OUT",
      "LAUNDRY_IN",
      "SALE",
      "TRANSFER",
      "WRITE_OFF",
      "REPORT_LOST",
    ] as StockRequestType[];

    if (requiredSourceLocationTypes.includes(val.type) && !val.stockId) {
      ctx.addIssue({
        code: "custom",
        path: ["stockId"],
        message: `Stock is required for '${val.type} type' of stock request`,
      });
    }
  });

export type StockRequestUpdateSchema = z.infer<typeof stockRequestUpdateSchema>;

export const stockRequestFilterSchema = z.object({
  page,
  dataPerPage,
  search: z.string().trim().min(3).optional(),
  type: stockRequestTypeEnum.optional(),
  status: stockRequestStatusEnum.optional(),
  destinationLocationId: z.string().trim().optional(),
  sourceLocationId: z.string().trim().optional(),
  sortBy: stockRequestSortByEnum.optional().default("createdAt"),
  sortOrder: sortOrderEnum,
});

export type StockRequestFilterSchema = z.infer<typeof stockRequestFilterSchema>;
