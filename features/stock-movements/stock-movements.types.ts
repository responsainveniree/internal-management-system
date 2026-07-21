import { ApiResponse } from "@/shared/lib/api-client";
import stockMovementsService from "./stock-movements.service";
import { stockRepository } from "../stocks/stock.repository";
import { MovementType, StockType } from "@prisma/client";
import { StockMovementCreateSchema } from "@/shared/lib/zods/stock-movements.zod";

type StockMovementServiceGetMany = Awaited<
  ReturnType<typeof stockMovementsService.getMany>
>;

type StockMovementServiceGetById = Awaited<
  ReturnType<typeof stockMovementsService.getById>
>;

export type StockMovementGetManyApiResponse = ApiResponse<
  StockMovementServiceGetMany["data"]
>;
export type StockMovementGetByIdApiResponse = ApiResponse<
  StockMovementServiceGetById["data"]
>;

// Create-Update-Delete
export type StockMovementCUDApiResponse = ApiResponse<{
  stockMovementId: string;
  stockId: string | null;
  itemId: string;
}>;

// helpers
export type Session = { id: string; role: string };

// Narrow shape of Stock actually used by the helpers below. Using the Prisma
// delegate's return type keeps this in sync with schema changes automatically.
export type StockRecord = NonNullable<
  Awaited<ReturnType<typeof stockRepository.findById>>
>;

export const TARGET_STOCK_TYPES = [
  "DAMAGED",
  "DIRTY",
  "LOST",
  "EXPIRED",
] as const satisfies readonly StockType[];

export type TargetStockType = (typeof TARGET_STOCK_TYPES)[number];

export const MOVEMENT_TYPE_BY_TARGET: Record<TargetStockType, MovementType> = {
  DAMAGED: "MARK_AS_DAMAGED",
  DIRTY: "MARK_AS_DIRTY",
  LOST: "MARK_AS_LOST",
  EXPIRED: "MARK_AS_EXPIRED",
};

// Frontend use case
export type ItemOption = { id: string; name: string };
export type LocationOption = { id: string; name: string };
export type MovementTypeOption = StockMovementCreateSchema["stockMovementType"];

// needed for ItemInfoPanel, for creating global stock or allocate stock
export type StockMovementFormOpenType = "GLOBAL_STOCK" | "ALLOCATE_STOCK";
