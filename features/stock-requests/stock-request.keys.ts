import { StockRequestFilterSchema } from "@/shared/lib/zods/stock-request.zod";

export const stockRequestKeys = {
  all: ["stock-requests"] as const,
  lists: () => [...stockRequestKeys.all, "list"] as const,
  list: (filters?: StockRequestFilterSchema) => {
    const base = [...stockRequestKeys.lists()] as const;
    return filters ? ([...base, filters] as const) : base;
  },
  details: () => [...stockRequestKeys.all, "detail"] as const,
  detail: (id: string) => [...stockRequestKeys.details(), id] as const,
};

export default stockRequestKeys;
