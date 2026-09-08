"use client";

import { useState } from "react";
import { Search, ChevronsLeft, ChevronsRight, MapPin } from "lucide-react";
import { StockRequestListItem } from "@/features/stock-requests/stock-request.types";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import { StockRequestFilterSchema } from "@/shared/lib/zods/stock-request.zod";
import { SearchLocationPopover } from "@/shared/components/search-components";
import { StockRequestStatus, StockRequestType } from "@prisma/client";
import { LocationOption } from "@/features/locations/location.types";

export type StockRequestTableFilters = {
  searchQuery: string;
  status: StockRequestStatus | "ALL";
  type: StockRequestType | "ALL";
  destinationLocationId: string;
};

type StockRequestTableProps = {
  stockRequests: StockRequestListItem[];
  totalStockRequests: number;
  isLoading: boolean;
  isError: boolean;
  filters: StockRequestTableFilters;
  onFiltersChange: (patch: Partial<StockRequestTableFilters>) => void;
  sortBy: StockRequestFilterSchema["sortBy"];
  sortOrder: StockRequestFilterSchema["sortOrder"];
  onRequestSort: (column: StockRequestFilterSchema["sortBy"]) => void;
  dataPerPage: number;
  onDataPerPageChange: (num: number) => void;
  page: number;
  onPageChange: (num: number) => void;
  locations?: LocationOption[];
  onInfo: (stockRequest: StockRequestListItem) => void;
  onReview: (stockRequest: StockRequestListItem) => void;
  onEdit: (stockRequest: StockRequestListItem) => void;
  onDelete: (stockRequest: StockRequestListItem) => void;
};

export default function StockRequestTable({
  stockRequests,
  totalStockRequests,
  isLoading,
  isError,
  filters,
  onFiltersChange,
  sortBy,
  sortOrder,
  onRequestSort,
  dataPerPage,
  onDataPerPageChange,
  page,
  onPageChange,
  locations = [],
  onInfo,
  onReview,
  onEdit,
  onDelete,
}: StockRequestTableProps) {
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalStockRequests / dataPerPage));
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  const rangeStart =
    stockRequests.length === 0 ? 0 : (page - 1) * dataPerPage + 1;
  const rangeEnd = Math.min(page * dataPerPage, totalStockRequests);

  const currentLocationLabel =
    filters.destinationLocationId === "ALL" || !filters.destinationLocationId
      ? "Destination: All Locations"
      : selectedLocationName
        ? `Destination: ${selectedLocationName}`
        : `Destination: ${locations.find((l) => l.id === filters.destinationLocationId)?.name || "…"}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Filter Bar Container */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#d9e3f4]/80 bg-white px-4 py-3 shadow-[0_16px_48px_-20px_rgba(15,23,42,0.08)] md:flex-row md:items-center md:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#565e74]/60"
            strokeWidth={1.5}
            aria-hidden
          />
          <Input
            type="search"
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
            placeholder="Search by item name (min 3 chars)..."
            className="h-10 rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 pl-10 font-ochre-ui text-sm focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(val) =>
              onFiltersChange({
                status: val as StockRequestTableFilters["status"],
              })
            }
          >
            <SelectTrigger className="h-10 min-w-36 rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 font-ochre-ui text-sm focus:border-[#894d0d]/35 focus:ring-2 focus:ring-[#894d0d]/15">
              <SelectValue placeholder="Status: All">
                {filters.status === "ALL"
                  ? "Status: All"
                  : `Status: ${filters.status}`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Status: All</SelectItem>
              <SelectItem value="PENDING">Status: Pending</SelectItem>
              <SelectItem value="APPROVED">Status: Approved</SelectItem>
              <SelectItem value="REJECTED">Status: Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Request Type Filter */}
          <Select
            value={filters.type}
            onValueChange={(val) =>
              onFiltersChange({
                type: val as StockRequestTableFilters["type"],
              })
            }
          >
            <SelectTrigger className="h-10 min-w-36 rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 font-ochre-ui text-sm focus:border-[#894d0d]/35 focus:ring-2 focus:ring-[#894d0d]/15">
              <SelectValue placeholder="Type: All">
                {filters.type === "ALL" ? "Type: All" : `Type: ${filters.type}`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Type: All</SelectItem>
              <SelectItem value="ISSUE">Issue</SelectItem>
              <SelectItem value="RESTOCK">Restock</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
              <SelectItem value="SALE">Sale</SelectItem>
              <SelectItem value="REPORT_LOST">Report Lost</SelectItem>
              <SelectItem value="WRITE_OFF">Write-Off</SelectItem>
              <SelectItem value="LAUNDRY_IN">Laundry In</SelectItem>
              <SelectItem value="LAUNDRY_OUT">Laundry Out</SelectItem>
            </SelectContent>
          </Select>

          {/* Destination Location Filter */}
          <SearchLocationPopover
            open={locationSearchOpen}
            onOpenChange={setLocationSearchOpen}
            selectedId={
              filters.destinationLocationId === "ALL"
                ? undefined
                : filters.destinationLocationId
            }
            showAllOption
            onSelect={(loc) => {
              setSelectedLocationName(loc.name);
              onFiltersChange({ destinationLocationId: loc.id });
            }}
            onSelectAll={() => {
              setSelectedLocationName("");
              onFiltersChange({ destinationLocationId: "ALL" });
            }}
          >
            <button
              type="button"
              className="inline-flex h-10 min-w-44 items-center justify-between gap-2 rounded-lg border border-[#e5eeff] bg-[#f8f9ff]/80 px-3 font-ochre-ui text-sm text-[#121c28] transition-colors hover:border-[#894d0d]/35 focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15"
            >
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="size-3.5 text-[#565e74] shrink-0" />
                <span className="truncate">{currentLocationLabel}</span>
              </span>
            </button>
          </SearchLocationPopover>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto rounded-xl border border-[#d9e3f4] bg-white shadow-[0_16px_48px_-20px_rgba(15,23,42,0.08)]">
        <table className="w-full border-collapse text-left">
          <TableHeader
            sortBy={sortBy}
            sortOrder={sortOrder}
            onRequestSort={onRequestSort}
          />
          <tbody className="divide-y divide-[#eef4ff]">
            {isError ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center font-ochre-ui text-sm font-medium text-rose-700"
                >
                  Unable to load stock requests. Please try refreshing.
                </td>
              </tr>
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={9} className="px-4 py-4">
                    <div className="h-5 rounded bg-[#eef4ff]/80" />
                  </td>
                </tr>
              ))
            ) : stockRequests.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center font-ochre-ui text-sm text-[#524439]/70"
                >
                  No stock requests found matching the criteria.
                </td>
              </tr>
            ) : (
              stockRequests.map((request, idx) => (
                <TableRow
                  key={`${request.id} + ${idx}`}
                  stockRequest={request}
                  index={idx}
                  onInfo={onInfo}
                  onReview={onReview}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 py-2 font-ochre-ui text-xs text-[#524439]">
        <div>
          Showing{" "}
          <span className="font-semibold text-[#121c28]">
            {rangeStart}–{rangeEnd}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-[#121c28]">
            {totalStockRequests}
          </span>{" "}
          stock requests
        </div>

        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select
              value={String(dataPerPage)}
              onValueChange={(val) => onDataPerPageChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-18 rounded-md border-[#e5eeff] bg-[#f8f9ff]/80 font-ochre-ui text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!hasPrevPage}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex size-8 items-center justify-center rounded-md border border-[#e5eeff] bg-white text-[#121c28] disabled:opacity-40 hover:bg-[#f8f9ff] transition-colors"
              aria-label="Previous Page"
            >
              <ChevronsLeft className="size-4" />
            </button>
            <span className="px-2 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={!hasNextPage}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex size-8 items-center justify-center rounded-md border border-[#e5eeff] bg-white text-[#121c28] disabled:opacity-40 hover:bg-[#f8f9ff] transition-colors"
              aria-label="Next Page"
            >
              <ChevronsRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
