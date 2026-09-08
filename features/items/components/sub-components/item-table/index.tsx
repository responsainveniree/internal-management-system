"use client";

import { useState } from "react";
import { ArrowDownUp, Folder, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import type { Item } from "@/features/items/item.types";
import { cn } from "@/shared/lib/utils";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import type { ItemGetManySchema } from "@/shared/lib/zods/item.zod";
import { SearchCategoryPopover } from "@/shared/components/search-components";
import DataTablePagination from "@/shared/components/DataTablePagination";

export type ItemTableFilters = {
  search: string;
  categoryId: string;
  activeStatus: true | false | undefined;
};

type ItemTableProps = {
  items: Item[];
  totalItems: number;
  isLoading: boolean;
  isError: boolean;
  filters: ItemTableFilters;
  onFiltersChange: (patch: Partial<ItemTableFilters>) => void;
  sortBy: ItemGetManySchema["sortBy"];
  sortOrder: "asc" | "desc";
  onRequestSort: (column: ItemGetManySchema["sortBy"]) => void;
  onToggleSort: () => void;
  dataPerPage: number;
  onDataPerPageChange: (page: number) => void;
  page: number;
  onPageChange: (page: number) => void;
  categoryOptions?: { id: string; name: string }[];
  onInfo: (item: { id: string; name: string }) => void;
  onEdit: (item: Item) => void;
  onStatusChange: (item: Item, status: "ACTIVE" | "INACTIVE") => void;
  onDelete: (item: Item) => void;
};

export default function ItemTable({
  items,
  totalItems,
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
  categoryOptions = [],
  onInfo,
  onEdit,
  onStatusChange,
  onDelete,
}: ItemTableProps) {
  const [categorySearchOpen, setCategorySearchOpen] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");

  const currentCategoryLabel =
    filters.categoryId === "ALL"
      ? "Category: All"
      : selectedCategoryName
        ? `Category: ${selectedCategoryName}`
        : `Category: ${categoryOptions.find((c) => c.id === filters.categoryId)?.name ?? "Selected"}`;

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
            placeholder="Search inventory..."
            className="h-10 rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 pl-10 font-ochre-ui text-sm focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SearchCategoryPopover
            open={categorySearchOpen}
            onOpenChange={setCategorySearchOpen}
            selectedId={filters.categoryId}
            showAllOption
            onSelect={(cat) => {
              setSelectedCategoryName(cat.name);
              onFiltersChange({ categoryId: cat.id });
            }}
            onSelectAll={() => {
              setSelectedCategoryName("");
              onFiltersChange({ categoryId: "ALL" });
            }}
          >
            <button
              type="button"
              className="inline-flex h-10 min-w-36 items-center justify-between gap-2 rounded-lg border border-[#e5eeff] bg-[#f8f9ff]/80 px-3 font-ochre-ui text-sm text-[#121c28] transition-colors hover:border-[#894d0d]/35 focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Folder className="size-3.5 text-[#565e74] shrink-0" />
                <span className="truncate">{currentCategoryLabel}</span>
              </span>
            </button>
          </SearchCategoryPopover>

          <Select
            value={
              filters.activeStatus === true
                ? "Active"
                : filters.activeStatus === false
                  ? "Inactive"
                  : "All"
            }
            onValueChange={(value) =>
              onFiltersChange({
                activeStatus: value === "All" ? undefined : value === "Active",
              })
            }
          >
            <SelectTrigger className="h-10 min-w-36 rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 font-ochre-ui text-sm focus:border-[#894d0d]/35 focus:ring-2 focus:ring-[#894d0d]/15">
              <SelectValue placeholder="Status: All">
                {filters.activeStatus === true
                  ? "Status: Active"
                  : filters.activeStatus === false
                    ? "Status: Inactive"
                    : "Status: All"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Status: All</SelectItem>
              <SelectItem value="Active">Status: Active</SelectItem>
              <SelectItem value="Inactive">Status: Inactive</SelectItem>
            </SelectContent>
          </Select>

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
                  colSpan={7}
                  className="px-6 py-12 text-center font-ochre-ui text-sm font-medium text-rose-700"
                >
                  Unable to load items. Please try refreshing.
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
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center font-ochre-ui text-sm text-[#524439]/70"
                >
                  No items match your filters.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <TableRow
                  key={item.id}
                  item={item}
                  index={idx}
                  onInfo={onInfo}
                  onEdit={onEdit}
                  onStatusChange={onStatusChange}
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
        totalCount={totalItems}
        dataPerPage={dataPerPage}
        onPageChange={onPageChange}
        onDataPerPageChange={onDataPerPageChange}
        pageSizeOptions={[10, 20, 50, 100]}
        entityLabel="items"
      />
    </div>
  );
}
