"use client";

import { useState } from "react";
import { ArrowDownUp, MapPin, Package, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import type { Stock, StockDelete } from "@/features/stocks/stock.types";
import { cn } from "@/shared/lib/utils";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import { StockGetManySchema } from "@/shared/lib/zods/stock.zod";
import {
  SearchLocationPopover,
  SearchItemPopover,
} from "@/shared/components/search-components";
import { LocationOption } from "@/features/locations/location.types";
import DataTablePagination from "@/shared/components/DataTablePagination";

export type StockTableFilters = {
  search: string;
  type: string;
  locationId: string;
  itemId: string;
};

type StockTableProps = {
  stocks: Stock[];
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  filters: StockTableFilters;
  onFiltersChange: (patch: Partial<StockTableFilters>) => void;
  sortBy: StockGetManySchema["sortBy"];
  sortOrder: "asc" | "desc";
  onRequestSort: (column: StockGetManySchema["sortBy"]) => void;
  onToggleSort: () => void;
  dataPerPage: number;
  onDataPerPageChange: (size: number) => void;
  page: number;
  onPageChange: (page: number) => void;
  locationOptions: LocationOption[];
  itemOptions: { id: string; name: string }[];
  onEdit: (stock: Stock) => void;
  onDelete: (stock: StockDelete) => void;
  onInfo: (stockId: string) => void;
};

export default function StockTable({
  stocks,
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
  locationOptions,
  itemOptions,
  onEdit,
  onDelete,
  onInfo,
}: StockTableProps) {
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState("");
  const [selectedItemName, setSelectedItemName] = useState("");

  const currentLocationLabel =
    filters.locationId === "ALL"
      ? "Location: All"
      : selectedLocationName
        ? `Location: ${selectedLocationName}`
        : `Location: ${locationOptions.find((l) => l.id === filters.locationId)?.name ?? "…"}`;

  const currentItemLabel =
    filters.itemId === "ALL"
      ? "Item: All"
      : selectedItemName
        ? `Item: ${selectedItemName}`
        : `Item: ${itemOptions.find((i) => i.id === filters.itemId)?.name ?? "…"}`;

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
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            placeholder="Search by item or location…"
            className="h-10 rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 pl-10 font-ochre-ui text-sm focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stock Type filter */}
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
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="DIRTY">Dirty</SelectItem>
              <SelectItem value="DAMAGED">Damaged</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>

          {/* Location filter */}
          <SearchLocationPopover
            open={locationSearchOpen}
            onOpenChange={setLocationSearchOpen}
            selectedId={
              filters.locationId === "ALL" ? undefined : filters.locationId
            }
            showAllOption
            onSelect={(loc) => {
              setSelectedLocationName(loc.name);
              onFiltersChange({ locationId: loc.id });
            }}
            onSelectAll={() => {
              setSelectedLocationName("");
              onFiltersChange({ locationId: "ALL" });
            }}
          >
            <button
              type="button"
              className="inline-flex h-10 min-w-36 items-center justify-between gap-2 rounded-lg border border-[#e5eeff] bg-[#f8f9ff]/80 px-3 font-ochre-ui text-sm text-[#121c28] transition-colors hover:border-[#894d0d]/35 focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15"
            >
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="size-3.5 text-[#565e74] shrink-0" />
                <span className="truncate">{currentLocationLabel}</span>
              </span>
            </button>
          </SearchLocationPopover>

          {/* Item filter */}
          <SearchItemPopover
            open={itemSearchOpen}
            onOpenChange={setItemSearchOpen}
            selectedId={filters.itemId === "ALL" ? undefined : filters.itemId}
            showAllOption
            onSelect={(item) => {
              setSelectedItemName(item.name);
              onFiltersChange({ itemId: item.id });
            }}
            onSelectAll={() => {
              setSelectedItemName("");
              onFiltersChange({ itemId: "ALL" });
            }}
          >
            <button
              type="button"
              className="inline-flex h-10 min-w-36 items-center justify-between gap-2 rounded-lg border border-[#e5eeff] bg-[#f8f9ff]/80 px-3 font-ochre-ui text-sm text-[#121c28] transition-colors hover:border-[#894d0d]/35 focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Package className="size-3.5 text-[#565e74] shrink-0" />
                <span className="truncate">{currentItemLabel}</span>
              </span>
            </button>
          </SearchItemPopover>

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
            showItemName={true}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onRequestSort={onRequestSort}
          />
          <tbody className="divide-y divide-[#eef4ff]">
            {isError ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center font-ochre-ui text-sm font-medium text-rose-700"
                >
                  Unable to load stock records. Please try refreshing.
                </td>
              </tr>
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="px-4 py-4">
                    <div className="h-5 rounded bg-[#eef4ff]/80" />
                  </td>
                </tr>
              ))
            ) : stocks.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center font-ochre-ui text-sm text-[#524439]/70"
                >
                  No stock records found matching the criteria.
                </td>
              </tr>
            ) : (
              stocks.map((stock, idx) => (
                <TableRow
                  key={stock.id}
                  showItemName={true}
                  stock={stock}
                  index={idx}
                  onEdit={onEdit}
                  onDelete={onDelete}
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
        entityLabel="stocks"
      />
    </div>
  );
}
