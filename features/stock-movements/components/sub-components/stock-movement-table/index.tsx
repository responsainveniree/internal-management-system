"use client";

import { useState } from "react";
import { ArrowDownUp, MapPin, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import type { StockMovementGetManyApiResponse } from "@/features/stock-movements/stock-movements.types";
import type { StockMovementGetManySchema } from "@/shared/lib/zods/stock-movements.zod";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import { LocationOption } from "@/features/locations/location.types";
import { SearchLocationPopover } from "@/shared/components/search-components";
import DataTablePagination from "@/shared/components/DataTablePagination";

type StockMovementRow =
  StockMovementGetManyApiResponse["data"]["movements"][number];

export type StockMovementTableFilters = {
  searchQuery: string;
  type: string;
  sourceLocation: string;
  destinationLocation: string;
};

type StockMovementTableProps = {
  locations: LocationOption[];
  movements: StockMovementRow[];
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  filters: StockMovementTableFilters;
  onFiltersChange: (patch: Partial<StockMovementTableFilters>) => void;
  sortBy: StockMovementGetManySchema["sortBy"];
  sortOrder: "asc" | "desc";
  onRequestSort: (column: StockMovementGetManySchema["sortBy"]) => void;
  onToggleSort: () => void;
  dataPerPage: number;
  onDataPerPageChange: (page: number) => void;
  page: number;
  onPageChange: (page: number) => void;
  movementTypes: string[];
  onInfo: (movementId: string) => void;
};

export default function StockMovementTable({
  locations,
  movements,
  totalCount,
  isLoading,
  isError,
  filters,
  onFiltersChange,
  sortBy,
  sortOrder,
  onRequestSort,
  onToggleSort,
  dataPerPage,
  onDataPerPageChange,
  page,
  onPageChange,
  movementTypes,
  onInfo,
}: StockMovementTableProps) {
  const [sourceLocationSearchOpen, setSourceLocationSearchOpen] =
    useState(false);
  const [destLocationSearchOpen, setDestLocationSearchOpen] = useState(false);
  const [selectedSourceName, setSelectedSourceName] = useState("");
  const [selectedDestName, setSelectedDestName] = useState("");

  const currentSourceLabel =
    filters.sourceLocation === "ALL"
      ? "Source: All"
      : selectedSourceName
        ? `Source: ${selectedSourceName}`
        : `Source: ${locations.find((l) => l.id === filters.sourceLocation)?.name || "…"}`;

  const currentDestLabel =
    filters.destinationLocation === "ALL"
      ? "Destination: All"
      : selectedDestName
        ? `Destination: ${selectedDestName}`
        : `Destination: ${locations.find((l) => l.id === filters.destinationLocation)?.name || "…"}`;

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
            onChange={(event) =>
              onFiltersChange({ searchQuery: event.target.value })
            }
            placeholder="Search item..."
            className="h-10 rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 pl-10 font-ochre-ui text-sm focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <Select
            value={filters.type}
            onValueChange={(value) => onFiltersChange({ type: value ?? "ALL" })}
          >
            <SelectTrigger className="h-10 min-w-36 rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 font-ochre-ui text-sm focus:border-[#894d0d]/35 focus:ring-2 focus:ring-[#894d0d]/15">
              <SelectValue>
                {filters.type === "ALL" ? "Type: All" : `Type: ${filters.type}`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Type: All</SelectItem>
              {movementTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Source location filter */}
          <SearchLocationPopover
            open={sourceLocationSearchOpen}
            onOpenChange={setSourceLocationSearchOpen}
            selectedId={
              filters.sourceLocation === "ALL"
                ? undefined
                : filters.sourceLocation
            }
            showAllOption
            onSelect={(loc) => {
              setSelectedSourceName(loc.name);
              onFiltersChange({ sourceLocation: loc.id });
            }}
            onSelectAll={() => {
              setSelectedSourceName("");
              onFiltersChange({ sourceLocation: "ALL" });
            }}
          >
            <button
              type="button"
              className="inline-flex h-10 min-w-36 items-center justify-between gap-2 rounded-lg border border-[#e5eeff] bg-[#f8f9ff]/80 px-3 font-ochre-ui text-sm text-[#121c28] transition-colors hover:border-[#894d0d]/35 focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15"
            >
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="size-3.5 text-[#565e74] shrink-0" />
                <span className="truncate">{currentSourceLabel}</span>
              </span>
            </button>
          </SearchLocationPopover>

          {/* Destination Location filter */}
          <SearchLocationPopover
            open={destLocationSearchOpen}
            onOpenChange={setDestLocationSearchOpen}
            selectedId={
              filters.destinationLocation === "ALL"
                ? undefined
                : filters.destinationLocation
            }
            showAllOption
            onSelect={(loc) => {
              setSelectedDestName(loc.name);
              onFiltersChange({ destinationLocation: loc.id });
            }}
            onSelectAll={() => {
              setSelectedDestName("");
              onFiltersChange({ destinationLocation: "ALL" });
            }}
          >
            <button
              type="button"
              className="inline-flex h-10 min-w-36 items-center justify-between gap-2 rounded-lg border border-[#e5eeff] bg-[#f8f9ff]/80 px-3 font-ochre-ui text-sm text-[#121c28] transition-colors hover:border-[#894d0d]/35 focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15"
            >
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="size-3.5 text-[#565e74] shrink-0" />
                <span className="truncate">{currentDestLabel}</span>
              </span>
            </button>
          </SearchLocationPopover>

          <button
            type="button"
            onClick={onToggleSort}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg border border-[#e5eeff] bg-[#f8f9ff]/80 text-[#565e74]",
              "hover:border-[#894d0d]/40 hover:bg-white hover:text-[#894d0d]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#894d0d]/15",
            )}
            aria-label={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
            title={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
          >
            <ArrowDownUp className="size-4" strokeWidth={1.5} />
          </button>
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
                  colSpan={6}
                  className="px-6 py-12 text-center font-ochre-ui text-sm font-medium text-rose-700"
                >
                  Unable to load stock movements. Please try refreshing.
                </td>
              </tr>
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-4 py-4">
                    <div className="h-5 rounded bg-[#eef4ff]/80" />
                  </td>
                </tr>
              ))
            ) : movements.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center font-ochre-ui text-sm text-[#524439]/70"
                >
                  No stock movements found matching the criteria.
                </td>
              </tr>
            ) : (
              movements.map((movement, idx) => (
                <TableRow
                  key={movement.id}
                  movement={movement}
                  index={idx}
                  onInfo={onInfo}
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
        entityLabel="stock movements"
      />
    </div>
  );
}
