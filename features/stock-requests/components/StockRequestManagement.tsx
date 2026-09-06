"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ClipboardList, Plus } from "lucide-react";
import {
  stockRequestFilterSchema,
  StockRequestFilterSchema,
} from "@/shared/lib/zods/stock-request.zod";
import StockRequestTable, {
  StockRequestTableFilters,
} from "./sub-components/stock-request-table";
import StockRequestDetailDialog from "./sub-components/StockRequestDetailDialog";
import StockRequestReviewModal from "./sub-components/StockRequestReviewModal";
import StockRequestCreateDialog from "./sub-components/StockRequestCreateDialog";
import StockRequestEditDialog from "./sub-components/StockRequestEditDialog";
import StockRequestDeleteDialog from "./sub-components/StockRequestDeleteDialog";
import { stockRequestStyles } from "../stock-request.styles";
import { LocationOption } from "@/features/locations/location.types";
import { StockRequestListItem } from "../stock-request.types";
import { useStockRequests } from "../stock-request.hooks";
import { canCreateStockRequest } from "@/shared/lib/validations/user-access-validation";

type StockRequestManagementProps = {
  locations: LocationOption[];
};

export default function StockRequestManagement({
  locations,
}: StockRequestManagementProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  // Pagination & sorting states
  const [page, setPage] = useState(1);
  const [dataPerPage, setDataPerPage] = useState(10);
  const [sortBy, setSortBy] =
    useState<StockRequestFilterSchema["sortBy"]>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filtering states
  const [filters, setFilters] = useState<StockRequestTableFilters>({
    searchQuery: "",
    status: "ALL",
    type: "ALL",
    destinationLocationId: "ALL",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals & action dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailRequest, setDetailRequest] =
    useState<StockRequestListItem | null>(null);
  const [reviewRequest, setReviewRequest] =
    useState<StockRequestListItem | null>(null);
  const [editRequest, setEditRequest] = useState<StockRequestListItem | null>(
    null,
  );
  const [deleteRequest, setDeleteRequest] =
    useState<StockRequestListItem | null>(null);

  // Debounce search query input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [filters.searchQuery]);

  // Reset to page 1 whenever filters or sorting change
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    filters.status,
    filters.type,
    filters.destinationLocationId,
    sortBy,
    sortOrder,
    dataPerPage,
  ]);

  // Memoized query parameter structure parsed through strict Zod schema
  const params: StockRequestFilterSchema = useMemo(() => {
    const search = debouncedSearch.trim();
    return stockRequestFilterSchema.parse({
      page,
      dataPerPage,
      sortBy,
      sortOrder,
      search: search.length >= 3 ? search : undefined,
      status: filters.status !== "ALL" ? filters.status : undefined,
      type: filters.type !== "ALL" ? filters.type : undefined,
      destinationLocationId:
        filters.destinationLocationId !== "ALL" &&
        filters.destinationLocationId.length > 0
          ? filters.destinationLocationId
          : undefined,
    });
  }, [
    page,
    dataPerPage,
    sortBy,
    sortOrder,
    debouncedSearch,
    filters.status,
    filters.type,
    filters.destinationLocationId,
  ]);

  // Execute TanStack Query fetch hook
  const { data: response, isLoading, isError } = useStockRequests(params);

  const stockRequests = response?.data?.stockRequests ?? [];
  const totalStockRequests = response?.data?.totalStockRequests ?? 0;

  const handleRequestSort = (column: StockRequestFilterSchema["sortBy"]) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Handling role-based action button visibility
  // Only HOUSEKEEPING and FRONT_DESK roles have creation permissions
  const canCreate = Boolean(userRole && canCreateStockRequest(userRole));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="size-7 text-[#894d0d]" />
            <h1 className={stockRequestStyles.headerTitle}>Stock Requests</h1>
          </div>
          <p className={stockRequestStyles.headerDescription}>
            Track, request, and review inventory items across hotel locations
            and departments.
          </p>
        </div>

        {/* Role-based create button */}
        {canCreate && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#894d0d] px-4 py-2.5 font-ochre-ui text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#a76526] active:scale-95 focus-visible:outline-2 focus-visible:outline-[#894d0d] self-start sm:self-auto"
          >
            <Plus className="size-4" strokeWidth={2} />
            Create Request
          </button>
        )}
      </div>

      {/* Main Stock Request Data Table */}
      <StockRequestTable
        stockRequests={stockRequests}
        totalStockRequests={totalStockRequests}
        isLoading={isLoading}
        isError={isError}
        filters={filters}
        onFiltersChange={(patch) =>
          setFilters((prev) => ({ ...prev, ...patch }))
        }
        sortBy={sortBy}
        sortOrder={sortOrder}
        onRequestSort={handleRequestSort}
        dataPerPage={dataPerPage}
        onDataPerPageChange={setDataPerPage}
        page={page}
        onPageChange={setPage}
        locations={locations}
        onInfo={(request) => setDetailRequest(request)}
        onReview={(request) => setReviewRequest(request)}
        onEdit={(request) => setEditRequest(request)}
        onDelete={(request) => setDeleteRequest(request)}
      />

      {/* Creation Modal */}
      <StockRequestCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => setIsCreateOpen(false)}
      />

      {/* Details Dialog */}
      <StockRequestDetailDialog
        open={Boolean(detailRequest)}
        stockRequest={detailRequest}
        onClose={() => setDetailRequest(null)}
      />

      {/* Review Modal for Hotel Managers / Supervisors */}
      <StockRequestReviewModal
        open={Boolean(reviewRequest)}
        stockRequest={reviewRequest}
        onClose={() => setReviewRequest(null)}
      />

      {/* Edit Dialog for Request Authors */}
      <StockRequestEditDialog
        open={Boolean(editRequest)}
        stockRequest={editRequest}
        onClose={() => setEditRequest(null)}
      />

      {/* Delete Confirmation Dialog */}
      <StockRequestDeleteDialog
        open={Boolean(deleteRequest)}
        stockRequest={deleteRequest}
        onClose={() => setDeleteRequest(null)}
      />
    </div>
  );
}
