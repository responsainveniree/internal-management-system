import {
  assertCanCreateStockRequest,
  assertCanDeleteStockRequest,
  assertCanReviewStockRequest,
  assertCanUpdateStockRequest,
} from "@/features/stock-requests/stock-request.rules";
import { StockRequestRepositoryFindById } from "@/features/stock-requests/stock-request.types";
import { ItemRepositoryFindById } from "@/features/items/item.types";
import { LocationRepositoryFindById } from "@/features/locations/location.types";
import { StockRepositoryFindById } from "@/features/stocks/stock.types";
import { badRequest, forbidden, notFound } from "@/shared/lib/error-handlers";
import {
  StockRequestReviewSchema,
  StockRequestUpdateSchema,
} from "@/shared/lib/zods/stock-request.zod";
import { Session } from "next-auth";

describe("stock-request.rules", () => {
  describe("assertCanReviewStockRequest", () => {
    const validReviewData: StockRequestReviewSchema = {
      stockRequestStatus: "APPROVED",
      stockRequestType: "ISSUE",
      approvedQuantity: 5,
      decisitonNotes: "Approved by manager",
      stockMovementReason: "Reason for movement",
    };

    const mockStockRequest = {
      id: "sr-1",
      itemId: "item-1",
      requestedQuantity: 5,
      sourceLocationId: "loc-1",
      destinationLocationId: "loc-2",
      type: "ISSUE",
      status: "PENDING",
      requestedById: "user-1",
      approvedById: null,
      decisionNotes: null,
      approvedQuantity: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as StockRequestRepositoryFindById;

    it("throws notFound when stockRequest is null", () => {
      expect(() =>
        assertCanReviewStockRequest(validReviewData, null, 10),
      ).toThrow(notFound("Stock request not found"));
    });

    it("throws badRequest when stock request has already been reviewed", () => {
      const reviewedRequest = {
        ...mockStockRequest,
        status: "APPROVED",
      } as unknown as StockRequestRepositoryFindById;

      expect(() =>
        assertCanReviewStockRequest(validReviewData, reviewedRequest, 10),
      ).toThrow(badRequest("This stock request has already been reviewed."));
    });

    it("throws badRequest when stock request type mismatches review data type", () => {
      const typeMismatchData: StockRequestReviewSchema = {
        ...validReviewData,
        stockRequestType: "RESTOCK",
      };

      expect(() =>
        assertCanReviewStockRequest(typeMismatchData, mockStockRequest, 10),
      ).toThrow(badRequest("Stock request type mismatch"));
    });

    it("throws notFound when totalActiveReadyStock is null or undefined", () => {
      expect(() =>
        assertCanReviewStockRequest(validReviewData, mockStockRequest, null),
      ).toThrow(notFound("Stock record not found."));

      expect(() =>
        assertCanReviewStockRequest(
          validReviewData,
          mockStockRequest,
          undefined,
        ),
      ).toThrow(notFound("Stock record not found."));
    });

    it("throws badRequest when totalActiveReadyStock is 0", () => {
      expect(() =>
        assertCanReviewStockRequest(validReviewData, mockStockRequest, 0),
      ).toThrow(
        badRequest(
          "Approved quantity cannot exceed the total ready stock quantity.",
        ),
      );
    });

    it("throws badRequest when totalActiveReadyStock is less than approved quantity", () => {
      expect(() =>
        assertCanReviewStockRequest(validReviewData, mockStockRequest, 4),
      ).toThrow(
        badRequest(
          "Approved quantity cannot exceed the total ready stock quantity.",
        ),
      );
    });

    it("succeeds when stock request is pending, types match, and stock is sufficient", () => {
      expect(() =>
        assertCanReviewStockRequest(validReviewData, mockStockRequest, 10),
      ).not.toThrow();
    });
  });

  describe("assertCanCreateStockRequest", () => {
    const mockItem = {
      id: "item-1",
      name: "Bedsheet",
    } as unknown as ItemRepositoryFindById;

    const mockStock = {
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as StockRepositoryFindById;

    const mockDestinationLocation = {
      id: "loc-2",
      name: "Floor 2 Linen Room",
    } as unknown as LocationRepositoryFindById;

    it("throws badRequest when item is null or undefined", () => {
      expect(() =>
        assertCanCreateStockRequest(
          null,
          mockStock,
          mockDestinationLocation,
          10,
          5,
        ),
      ).toThrow(badRequest("Item not found"));
    });

    it("throws badRequest when stock is null or undefined", () => {
      expect(() =>
        assertCanCreateStockRequest(
          mockItem,
          null as unknown as StockRepositoryFindById,
          mockDestinationLocation,
          10,
          5,
        ),
      ).toThrow(badRequest("Stock not found"));
    });

    it("throws badRequest when destination location is null or undefined", () => {
      expect(() =>
        assertCanCreateStockRequest(
          mockItem,
          mockStock,
          null as unknown as LocationRepositoryFindById,
          10,
          5,
        ),
      ).toThrow(badRequest("Destination location not found"));
    });

    it("throws badRequest when totalReadyStock is null or undefined", () => {
      expect(() =>
        assertCanCreateStockRequest(
          mockItem,
          mockStock,
          mockDestinationLocation,
          null,
          5,
        ),
      ).toThrow(badRequest("Unable to determine the total ready stock."));

      expect(() =>
        assertCanCreateStockRequest(
          mockItem,
          mockStock,
          mockDestinationLocation,
          undefined,
          5,
        ),
      ).toThrow(badRequest("Unable to determine the total ready stock."));
    });

    it("throws badRequest when totalReadyStock is less than requested quantity", () => {
      expect(() =>
        assertCanCreateStockRequest(
          mockItem,
          mockStock,
          mockDestinationLocation,
          4,
          5,
        ),
      ).toThrow(badRequest("Requested quantity exceeds the available stock."));
    });

    it("succeeds when all parameters are valid and sufficient stock exists", () => {
      expect(() =>
        assertCanCreateStockRequest(
          mockItem,
          mockStock,
          mockDestinationLocation,
          10,
          5,
        ),
      ).not.toThrow();
    });
  });

  describe("assertCanUpdateStockRequest", () => {
    const mockUpdateData: StockRequestUpdateSchema = {
      type: "ISSUE",
      requestedQuantity: 5,
      stockId: "stock-1",
      destinationLocationId: "loc-2",
    };

    const mockStockRequest = {
      id: "sr-1",
      itemId: "item-1",
      status: "PENDING",
    } as unknown as StockRequestRepositoryFindById;

    const mockStock = {
      id: "stock-1",
      locationId: "loc-1",
    } as unknown as StockRepositoryFindById;

    const mockDestinationLocation = {
      id: "loc-2",
      name: "Floor 2 Linen Room",
    } as unknown as LocationRepositoryFindById;

    it("throws notFound when stockId is provided but stock is null", () => {
      expect(() =>
        assertCanUpdateStockRequest(
          mockUpdateData,
          mockStockRequest,
          null as unknown as StockRepositoryFindById,
          mockDestinationLocation,
          10,
        ),
      ).toThrow(notFound("stock not found"));
    });

    it("does not throw notFound for stock when stockId is not provided and stock is null", () => {
      const dataWithoutStockId: StockRequestUpdateSchema = {
        type: "RESTOCK",
        requestedQuantity: 5,
        destinationLocationId: "loc-2",
      };

      expect(() =>
        assertCanUpdateStockRequest(
          dataWithoutStockId,
          mockStockRequest,
          null as unknown as StockRepositoryFindById,
          mockDestinationLocation,
          10,
        ),
      ).not.toThrow();
    });

    it("throws notFound when destination location is null", () => {
      expect(() =>
        assertCanUpdateStockRequest(
          mockUpdateData,
          mockStockRequest,
          mockStock,
          null as unknown as LocationRepositoryFindById,
          10,
        ),
      ).toThrow(notFound("Destination location not found"));
    });

    it("throws notFound when stock request is null", () => {
      expect(() =>
        assertCanUpdateStockRequest(
          mockUpdateData,
          null,
          mockStock,
          mockDestinationLocation,
          10,
        ),
      ).toThrow(notFound("Stock request not found"));
    });

    it("throws badRequest when stock request has already been reviewed", () => {
      const reviewedRequest = {
        ...mockStockRequest,
        status: "APPROVED",
      } as unknown as StockRequestRepositoryFindById;

      expect(() =>
        assertCanUpdateStockRequest(
          mockUpdateData,
          reviewedRequest,
          mockStock,
          mockDestinationLocation,
          10,
        ),
      ).toThrow(
        badRequest("Can't update a stock request that has been reviewed"),
      );
    });

    it("throws badRequest when source location matches destination location", () => {
      const sameLocationStock = {
        id: "stock-1",
        locationId: "loc-2",
      } as unknown as StockRepositoryFindById;

      expect(() =>
        assertCanUpdateStockRequest(
          mockUpdateData,
          mockStockRequest,
          sameLocationStock,
          mockDestinationLocation,
          10,
        ),
      ).toThrow(
        badRequest("Source location and destination location can't be same"),
      );
    });

    it("throws notFound when totalActiveReadyStock is null or undefined", () => {
      expect(() =>
        assertCanUpdateStockRequest(
          mockUpdateData,
          mockStockRequest,
          mockStock,
          mockDestinationLocation,
          null,
        ),
      ).toThrow(notFound("Stock record not found."));

      expect(() =>
        assertCanUpdateStockRequest(
          mockUpdateData,
          mockStockRequest,
          mockStock,
          mockDestinationLocation,
          undefined,
        ),
      ).toThrow(notFound("Stock record not found."));
    });

    it("throws badRequest when totalActiveReadyStock is 0", () => {
      expect(() =>
        assertCanUpdateStockRequest(
          mockUpdateData,
          mockStockRequest,
          mockStock,
          mockDestinationLocation,
          0,
        ),
      ).toThrow(
        badRequest(
          "Requested quantity cannot exceed the total ready stock quantity.",
        ),
      );
    });

    it("throws badRequest when totalActiveReadyStock is less than requested quantity", () => {
      expect(() =>
        assertCanUpdateStockRequest(
          mockUpdateData,
          mockStockRequest,
          mockStock,
          mockDestinationLocation,
          4,
        ),
      ).toThrow(
        badRequest(
          "Requested quantity cannot exceed the total ready stock quantity.",
        ),
      );
    });

    it("succeeds when all parameters and stock quantities are valid", () => {
      expect(() =>
        assertCanUpdateStockRequest(
          mockUpdateData,
          mockStockRequest,
          mockStock,
          mockDestinationLocation,
          10,
        ),
      ).not.toThrow();
    });
  });

  describe("assertCanDeleteStockRequest", () => {
    const stockRequest = { requestedById: "user-author" };

    it("allows deletion by HOTEL_MANAGER regardless of who created the request", () => {
      const session = {
        id: "user-manager",
        role: "HOTEL_MANAGER",
      } as Session["user"];

      expect(() =>
        assertCanDeleteStockRequest(session, stockRequest),
      ).not.toThrow();
    });

    it("allows deletion by SUPERVISOR regardless of who created the request", () => {
      const session = {
        id: "user-supervisor",
        role: "SUPERVISOR",
      } as Session["user"];

      expect(() =>
        assertCanDeleteStockRequest(session, stockRequest),
      ).not.toThrow();
    });

    it("allows deletion by HOUSEKEEPING when deleting their own request", () => {
      const session = {
        id: "user-author",
        role: "HOUSEKEEPING",
      } as Session["user"];

      expect(() =>
        assertCanDeleteStockRequest(session, stockRequest),
      ).not.toThrow();
    });

    it("allows deletion by FRONT_DESK when deleting their own request", () => {
      const session = {
        id: "user-author",
        role: "FRONT_DESK",
      } as Session["user"];

      expect(() =>
        assertCanDeleteStockRequest(session, stockRequest),
      ).not.toThrow();
    });

    it("throws forbidden when HOUSEKEEPING tries to delete another user's request", () => {
      const session = {
        id: "user-other",
        role: "HOUSEKEEPING",
      } as Session["user"];

      expect(() => assertCanDeleteStockRequest(session, stockRequest)).toThrow(
        forbidden("You are only allowed to delete your own stock requests."),
      );
    });

    it("throws forbidden when FRONT_DESK tries to delete another user's request", () => {
      const session = {
        id: "user-other",
        role: "FRONT_DESK",
      } as Session["user"];

      expect(() => assertCanDeleteStockRequest(session, stockRequest)).toThrow(
        forbidden("You are only allowed to delete your own stock requests."),
      );
    });

    it("throws forbidden when role has no delete privileges", () => {
      const session = {
        id: "user-author",
        role: "ACCOUNTANT",
      } as Session["user"];

      expect(() => assertCanDeleteStockRequest(session, stockRequest)).toThrow(
        forbidden("You are not allowed to delete this stock request."),
      );
    });
  });
});
