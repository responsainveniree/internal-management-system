import { badRequest, forbidden, notFound } from "@/shared/lib/error-handlers";
import {
  canDeleteAllStockRequest,
  canDeleteOwnStockRequest,
} from "@/shared/lib/validations/user-access-validation";
import { Session } from "next-auth";
import { ItemRepositoryFindById } from "../items/item.types";
import { StockRepositoryFindById } from "../stocks/stock.types";
import { LocationRepositoryFindById } from "../locations/location.types";
import {
  StockRequestReviewSchema,
  StockRequestUpdateSchema,
} from "@/shared/lib/zods/stock-request.zod";
import { StockRequestRepositoryFindById } from "./stock-request.types";

export function assertCanReviewStockRequest(
  data: StockRequestReviewSchema,
  stockRequest: StockRequestRepositoryFindById,
  totalActiveReadyStock: number | null | undefined,
) {
  if (!stockRequest) throw notFound("Stock request not found");

  if (stockRequest.status !== "PENDING") {
    throw badRequest("This stock request has already been reviewed.");
  }

  if (stockRequest?.type !== data.stockRequestType) {
    throw badRequest("Stock request type mismatch");
  }

  // Guard clause: Ensure stock record exists
  if (totalActiveReadyStock === null || totalActiveReadyStock === undefined) {
    throw notFound("Stock record not found.");
  }

  if (!totalActiveReadyStock || totalActiveReadyStock < data.approvedQuantity) {
    throw badRequest(
      "Approved quantity cannot exceed the total ready stock quantity.",
    );
  }
}

export function assertCanCreateStockRequest(
  item: ItemRepositoryFindById | undefined | null,
  stock: StockRepositoryFindById,
  destinationLocation: LocationRepositoryFindById,
  totalReadyStock: number | undefined | null,
  requestedQuantity: number,
) {
  if (!item) throw badRequest("Item not found");
  if (!stock) throw badRequest("Stock not found");
  if (!destinationLocation) throw badRequest("Destination location not found");

  if (totalReadyStock === undefined || totalReadyStock === null) {
    throw badRequest("Unable to determine the total ready stock.");
  }

  if (totalReadyStock < requestedQuantity) {
    throw badRequest("Requested quantity exceeds the available stock.");
  }
}

export function assertCanUpdateStockRequest(
  data: StockRequestUpdateSchema,
  stockRequest: StockRequestRepositoryFindById,
  stock: StockRepositoryFindById,
  destinationLocation: LocationRepositoryFindById,
  totalActiveReadyStock: number | null | undefined,
) {
  if (!stock && data.stockId) throw notFound("stock not found");
  if (!destinationLocation) throw notFound("Destination location not found");
  if (!stockRequest) throw notFound("Stock request not found");

  if (stockRequest.status !== "PENDING")
    throw badRequest("Can't update a stock request that has been reviewed");

  if (stock?.locationId === destinationLocation.id)
    throw badRequest("Source location and destination location can't be same");

  // Guard clause: Ensure stock record exists
  if (totalActiveReadyStock === null || totalActiveReadyStock === undefined) {
    throw notFound("Stock record not found.");
  }

  if (
    !totalActiveReadyStock ||
    totalActiveReadyStock < data.requestedQuantity
  ) {
    throw badRequest(
      "Requested quantity cannot exceed the total ready stock quantity.",
    );
  }
}

export function assertCanDeleteStockRequest(
  session: Session["user"],
  stockRequest: { requestedById: string; status: string },
): void {
  if (!stockRequest) throw badRequest("Stock request not found.");

  if (stockRequest.status !== "PENDING") {
    throw badRequest("Can't delete a stock request that has been reviewed");
  }

  // If the user has global delete permission, allow execution
  if (canDeleteAllStockRequest(session.role)) {
    return;
  }

  // If the user has self-delete permission, enforce ownership match
  if (canDeleteOwnStockRequest(session.role)) {
    if (stockRequest.requestedById !== session.id) {
      throw forbidden(
        "You are only allowed to delete your own stock requests.",
      );
    }
    return;
  }

  // Reject all other cases
  throw forbidden("You are not allowed to delete this stock request.");
}
