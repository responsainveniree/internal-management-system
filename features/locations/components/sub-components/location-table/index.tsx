"use client";

import { Search } from "lucide-react";
import type { LocationListItem } from "@/features/locations/location.types";
import { LOCATION_TYPE_OPTIONS } from "@/features/locations/location.utils";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import DataTablePagination from "@/shared/components/DataTablePagination";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import type { LocationGetManySchema } from "@/shared/lib/zods/location.zod";

export type LocationTableFilters = {
  searchQuery: string;
  locationType?: string;
};

type LocationTableProps = {
  locations: LocationListItem[];
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  filters: LocationTableFilters;
  onFiltersChange: (patch: Partial<LocationTableFilters>) => void;
  sortBy: LocationGetManySchema["sortBy"];
  sortOrder: "asc" | "desc";
  onRequestSort: (column: LocationGetManySchema["sortBy"]) => void;
  page: number;
  dataPerPage: number;
  onPageChange: (page: number) => void;
  onDataPerPageChange: (dataPerPage: number) => void;
  onInfo: (location: LocationListItem) => void;
  onEdit: (location: LocationListItem) => void;
  onDelete: (location: LocationListItem) => void;
};

export default function LocationTable({
  locations,
  totalCount,
  isLoading,
  isError,
  filters,
  onFiltersChange,
  sortBy,
  sortOrder,
  onRequestSort,
  page,
  dataPerPage,
  onPageChange,
  onDataPerPageChange,
  onInfo,
  onEdit,
  onDelete,
}: LocationTableProps) {
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
            placeholder="Search locations by name..."
            className="h-10 rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 pl-10 font-ochre-ui text-sm focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.locationType ?? "ALL"}
            onValueChange={(val) =>
              onFiltersChange({
                locationType: val === "ALL" ? undefined : val,
              })
            }
          >
            <SelectTrigger className="h-10 min-w-40 rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 font-ochre-ui text-sm focus:border-[#894d0d]/35 focus:ring-2 focus:ring-[#894d0d]/15">
              <SelectValue placeholder="Type: All">
                {filters.locationType && filters.locationType !== "ALL"
                  ? `Type: ${LOCATION_TYPE_OPTIONS.find((o) => o.value === filters.locationType)?.label ?? filters.locationType}`
                  : "Type: All"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Type: All</SelectItem>
              {LOCATION_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  Type: {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  colSpan={5}
                  className="px-6 py-12 text-center font-ochre-ui text-sm font-medium text-rose-700"
                >
                  Unable to load location records. Please try refreshing.
                </td>
              </tr>
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-4 py-4">
                    <div className="h-5 rounded bg-[#eef4ff]/80" />
                  </td>
                </tr>
              ))
            ) : locations.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center font-ochre-ui text-sm text-[#524439]/70"
                >
                  No locations found matching the criteria.
                </td>
              </tr>
            ) : (
              locations.map((location, idx) => (
                <TableRow
                  key={location.id}
                  location={location}
                  index={idx}
                  onInfo={onInfo}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination Controls */}
      <DataTablePagination
        page={page}
        totalCount={totalCount}
        dataPerPage={dataPerPage}
        onPageChange={onPageChange}
        onDataPerPageChange={onDataPerPageChange}
        pageSizeOptions={[10, 20, 50, 100]}
        entityLabel="locations"
      />
    </div>
  );
}
