import {
  StockGetByIdSchema,
  StockGetManySchema,
} from "@/shared/lib/zods/stock.zod";

const STOCK_KEYS = {
  all: ["stocks"] as const,
  lists: () => [...STOCK_KEYS.all, "list"] as const,
  list: (filters: StockGetManySchema) =>
    [...STOCK_KEYS.lists(), { filters }] as const,
  details: () => [...STOCK_KEYS.all, "detail"] as const,
  detail: (id: string, filters?: StockGetByIdSchema) =>
    [...STOCK_KEYS.details(), id, ...(filters ? [{ filters }] : [])] as const,
};

export default STOCK_KEYS;
