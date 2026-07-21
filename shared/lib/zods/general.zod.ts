import { itemStockStatusArray } from "@/features/items/item.utils";
import { Entity, LocationType, MovementType, StockType } from "@prisma/client";
import z from "zod";

export const searchQuery = z.string().trim().min(3).optional();
export const page = z.coerce.number().min(1).default(1);
export const dataPerPage = z.coerce.number().min(10).default(10);
export const sortOrderEnum = z.enum(["asc", "desc"]).default("asc");

export const userActionEnum = z.enum(["CREATE", "UPDATE", "DELETE"]);
export const sortItemByEnum = z.enum(["name", "createdAt"]).default("name");
export const filterItemByEnum = z.enum(["category"]).default("category");
export const sortItemDetailByEnum = z.enum(["quantity", "updatedAt", "status"]);

export const statusItemEnum = z.enum(itemStockStatusArray);
export const sortItemEnumAtLocation = z
  .enum(["name", "stockType"])
  .default("name");
export const stockStatusEnum = z.enum([
  ...Object.values(StockType),
  "EXPIRING_SOON",
  "ALL",
]);

export const entityEnum = z.enum(Object.values(Entity));

export const sortLocationEnum = z
  .enum(["name", "createdAt", "type", "updatedAt"])
  .default("type");
export const locationEnum = z.enum(Object.values(LocationType));

export const stockEnum = z.enum(Object.values(StockType));
export const stockSortByEnum = z.enum([
  "quantity",
  "stockType",
  "expiredAt",
  "createdAt",
  "updatedAt",
]);
// For specific stock information, that return stock movement as one of the data
export const stockSpecificSortByEnum = z.enum(["createdAt", "type"]);

export const stockMovementTypeEnum = z.enum([...Object.values(MovementType)]);
export const stockMovementSortByEnum = z.enum([
  "name",
  "createdAt",
  "type",
  "sourceLocation",
  "destinationLocation",
]);

export const generateReadableError = (issue: z.core.$ZodIssue): string => {
  const fieldName = issue.path.join(".");

  switch (issue.code) {
    case "invalid_type":
      return issue.input === undefined
        ? `${fieldName} is required`
        : `${fieldName} should be a ${issue.expected}`;
    case "too_small":
      return `${fieldName} must be at least ${issue.minimum} characters`;
    default:
      return issue.message;
  }
};

export const auditLogSchema = z.object({
  userId: z.string(),
  action: userActionEnum,
  entity: entityEnum,
  entityId: z.string(),
  metadata: z.record(z.any(), z.any()).default({}),
});

export type AuditLog = z.infer<typeof auditLogSchema>;
