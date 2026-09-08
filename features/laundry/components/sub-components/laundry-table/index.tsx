"use client";

import { Search, MapPin } from "lucide-react";
import { Laundry, LaundryFilterStatus } from "@/features/laundry/laundry.types";
import { Input } from "@/shared/components/ui/input";
import DataTablePagination from "@/shared/components/DataTablePagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import { LaundryGetManySchema } from "@/shared/lib/zods/laundry.zod";
import { SearchLocationPopover } from "@/shared/components/search-components";

export type LaundryTableFilters = {
  searchQuery: string;
  status: LaundryFilterStatus;
  sourceLocationId: string;
};

type LaundryTableProps = {
  laundries: Laundry[];
  totalLaundries: number;
  isLoading: boolean;
  isError: boolean;
  filters: LaundryTableFilters;
  onFiltersChange: (patch: Partial<LaundryTableFilters>) => void;
  sortBy: LaundryGetManySchema["sortBy"];
  sortOrder: "asc" | "desc";
  onRequestSort: (column: LaundryGetManySchema["sortBy"]) => void;
  dataPerPage: number;
  onDataPerPageChange: (num: number) => void;
  page: number;
  onPageChange: (num: number) => void;
  locations: { id: string; name: string }[];
  onInfo: (laundry: Laundry) => void;
  onAction: (laundry: Laundry, actionType: "RETURNED" | "CANCELLED") => void;
};

export default function LaundryTable({
  laundries,
  totalLaundries,
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
  locations,
  onInfo,
  onAction,
}: LaundryTableProps) {
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalLaundries / dataPerPage));
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  const rangeStart = laundries.length === 0 ? 0 : (page - 1) * dataPerPage + 1;
  const rangeEnd = Math.min(page * dataPerPage, totalLaundries);

  const currentLocationLabel =
    filters.sourceLocationId === "ALL"
      ? "Source: All Locations"
      : selectedLocationName
        ? `Source: ${selectedLocationName}`
        : `Source: ${locations.find((l) => l.id === filters.sourceLocationId)?.name || "…"}`;

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
            placeholder="Search by item name or reason..."
            className="h-10 rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 pl-10 font-ochre-ui text-sm focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(val) =>
              onFiltersChange({
                status: val as LaundryTableFilters["status"],
              })
            }
          >
            <SelectTrigger className="h-10 min-w-40 rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 font-ochre-ui text-sm focus:border-[#894d0d]/35 focus:ring-2 focus:ring-[#894d0d]/15">
              <SelectValue placeholder="Status: All">
                {filters.status === "ALL"
                  ? "Status: All"
                  : `Status: ${filters.status}`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Status: All</SelectItem>
              <SelectItem value="SENT">Status: Sent (Pending)</SelectItem>
              <SelectItem value="RETURNED">Status: Returned</SelectItem>
              <SelectItem value="CANCELLED">Status: Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Location Filter */}
          <SearchLocationPopover
            open={locationSearchOpen}
            onOpenChange={setLocationSearchOpen}
            selectedId={
              filters.sourceLocationId === "ALL"
                ? undefined
                : filters.sourceLocationId
            }
            showAllOption
            onSelect={(loc) => {
              setSelectedLocationName(loc.name);
              onFiltersChange({ sourceLocationId: loc.id });
            }}
            onSelectAll={() => {
              setSelectedLocationName("");
              onFiltersChange({ sourceLocationId: "ALL" });
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
                  Unable to load laundry records. Please try refreshing.
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
            ) : laundries.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center font-ochre-ui text-sm text-[#524439]/70"
                >
                  No laundry records found matching the criteria.
                </td>
              </tr>
            ) : (
              laundries.map((laundry, idx) => (
                <TableRow
                  key={laundry.id}
                  laundry={laundry}
                  index={idx}
                  onInfo={onInfo}
                  onAction={onAction}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom-right Pagination Controls */}
      <DataTablePagination
        page={page}
        totalCount={totalLaundries}
        dataPerPage={dataPerPage}
        onPageChange={onPageChange}
        onDataPerPageChange={onDataPerPageChange}
        pageSizeOptions={[5, 10, 25, 50]}
        entityLabel="laundry records"
      />
    </div>
  );
}
