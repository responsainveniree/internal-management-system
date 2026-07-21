import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import stockApi from "./stock.api";
import {
  StockCreateSchema,
  StockGetByIdSchema,
  StockGetManySchema,
  StockUpdateSchema,
} from "@/shared/lib/zods/stock.zod";
import {
  StockGetByIdApiResponse,
  StockGetManyApiResponse,
} from "./stock.types";
import STOCK_KEYS from "./stock.keys";
import { toast } from "sonner";
import ITEM_KEYS from "../items/item.keys";

export const useStocks = (
  params: StockGetManySchema,
  optional: Partial<UseQueryOptions<StockGetManyApiResponse>>,
) => {
  return useQuery({
    queryKey: STOCK_KEYS.list(params),
    queryFn: () => stockApi.getMany(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...optional,
  });
};

export const useStockById = (
  stockId: string,
  params: StockGetByIdSchema,
  optional?: Partial<UseQueryOptions<StockGetByIdApiResponse>>,
) => {
  return useQuery({
    queryKey: STOCK_KEYS.detail(stockId, params),
    queryFn: () => stockApi.getById(stockId, params),
    enabled: Boolean(stockId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...optional,
  });
};

export const useCreateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StockCreateSchema) => stockApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: STOCK_KEYS.lists() });
      toast.success(data.message);
    },
  });
};

export const useUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stockId,
      payload,
    }: {
      stockId: string;
      payload: StockUpdateSchema;
    }) => stockApi.update(stockId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ITEM_KEYS.detail(data.data.id) });
      queryClient.invalidateQueries({ queryKey: STOCK_KEYS.lists() });
      toast.success(data.message);
    },
  });
};

export const useDeleteStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => stockApi.delete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: STOCK_KEYS.lists() });
      toast.success(data.message);
    },
  });
};
