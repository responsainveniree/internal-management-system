import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { stockRequestKeys } from "./stock-request.keys";
import {
  StockRequestCreateSchema,
  StockRequestFilterSchema,
  StockRequestReviewSchema,
  StockRequestUpdateSchema,
} from "@/shared/lib/zods/stock-request.zod";
import {
  StockRequestGetByIdResponse,
  StockRequestGetManyApiResponse,
} from "./stock-request.types";
import stockRequestApi from "./stock-request.api";
import { toast } from "sonner";
import STOCK_KEYS from "../stocks/stock.keys";
import STOCK_MOVEMENT_KEYS from "../stock-movements/stock-movements.keys";
import { dashboardKeys } from "../dashboards/dashboard.keys";

export const useStockRequests = (
  params: StockRequestFilterSchema,
  options?: Partial<UseQueryOptions<StockRequestGetManyApiResponse>>,
) => {
  return useQuery({
    queryKey: stockRequestKeys.list(params),
    queryFn: () => stockRequestApi.getMany(params),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

export const useStockRequestById = (
  stockRequestId: string | null,
  options?: Partial<UseQueryOptions<StockRequestGetByIdResponse>>,
) => {
  return useQuery({
    queryKey: stockRequestKeys.detail(stockRequestId ?? ""),
    queryFn: () => stockRequestApi.getById(stockRequestId!),
    enabled: Boolean(stockRequestId),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

export const useCreateStockRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StockRequestCreateSchema) =>
      stockRequestApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: stockRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: STOCK_KEYS.lists() });
      toast.success(data.message || "Stock request created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create stock request");
    },
  });
};

export const useUpdateStockRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: StockRequestUpdateSchema;
    }) => stockRequestApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: stockRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockRequestKeys.details() });
      toast.success(data.message || "Stock request updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update stock request");
    },
  });
};

export const useReviewStockRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: StockRequestReviewSchema;
    }) => stockRequestApi.review(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: stockRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockRequestKeys.details() });
      queryClient.invalidateQueries({ queryKey: STOCK_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: STOCK_MOVEMENT_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.financialSummary(),
      });
      toast.success(data.message || "Stock request reviewed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to review stock request");
    },
  });
};

export const useDeleteStockRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => stockRequestApi.delete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: stockRequestKeys.lists() });
      toast.success(data.message || "Stock request deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete stock request");
    },
  });
};
