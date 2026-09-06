import { ApiResponse } from "@/shared/lib/api-client";
import { Role } from "@prisma/client";
import stockRequestService from "./stock-request.service";
import { stockRequestRepository } from "./stock-request.repository";

export type StockRequestCUDApiResponse = ApiResponse<{
  id: string;
}>;

type StockRequestGetManyResult = Awaited<
  ReturnType<typeof stockRequestService.getMany>
>;
type StockRequestGetByIdResult = Awaited<
  ReturnType<typeof stockRequestService.getById>
>;

export type StockRequestListItem =
  StockRequestGetManyResult["data"]["stockRequests"][number];
export type StockRequestDetail = StockRequestGetByIdResult["stockRequest"];

export type StockRequestGetManyApiResponse = ApiResponse<{
  stockRequests: StockRequestGetManyResult["data"]["stockRequests"];
  totalStockRequests: StockRequestGetManyResult["data"]["totalStockRequests"];
}>;
export type StockRequestGetByIdResponse = ApiResponse<{
  stockRequest: StockRequestGetByIdResult["stockRequest"];
}>;

export const reviewerRoles: Role[] = ["HOTEL_MANAGER", "SUPERVISOR"];
export const requesterRoles: Role[] = ["HOUSEKEEPING", "FRONT_DESK"];

// repository types
export type StockRequestRepositoryFindById = Awaited<
  ReturnType<typeof stockRequestRepository.findById>
>;
