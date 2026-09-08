"use client";

import { Search } from "lucide-react";
import type { CategoryListItem } from "@/features/categories/category.types";
import { Input } from "@/shared/components/ui/input";
import DataTablePagination from "@/shared/components/DataTablePagination";
import TableHeader, { type CategorySortBy } from "./TableHeader";
import TableRow from "./TableRow";
import type { CategoryGetManySchema } from "@/shared/lib/zods/category.zod";

export type CategoryTableFilters = {
  searchQuery: string;
};

type CategoryTableProps = {
  totalCategoryData: number;
  categories: CategoryListItem[];
  isLoading: boolean;
  isError: boolean;
  filters: CategoryTableFilters;
  onFiltersChange: (patch: Partial<CategoryTableFilters>) => void;
  sortBy: CategorySortBy;
  sortOrder: CategoryGetManySchema["sortOrder"];
  onRequestSort: (column: CategorySortBy) => void;
  page: number;
  dataPerPage: number;
  onPageChange: (page: number) => void;
  onDataPerPageChange: (dataPerPage: number) => void;
  onInfo: (categoryId: string) => void;
  onEdit: (category: CategoryListItem) => void;
  onDelete: (category: CategoryListItem) => void;
};

export default function CategoryTable({
  totalCategoryData,
  categories,
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
}: CategoryTableProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar Container */}
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
            placeholder="Search categories by name..."
            className="h-10 rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 pl-10 font-ochre-ui text-sm focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15"
          />
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
                  colSpan={4}
                  className="px-6 py-12 text-center font-ochre-ui text-sm font-medium text-rose-700"
                >
                  Unable to load category records. Please try refreshing.
                </td>
              </tr>
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={4} className="px-4 py-4">
                    <div className="h-5 rounded bg-[#eef4ff]/80" />
                  </td>
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center font-ochre-ui text-sm text-[#524439]/70"
                >
                  No categories found matching the criteria.
                </td>
              </tr>
            ) : (
              categories.map((category, idx) => (
                <TableRow
                  key={category.id}
                  category={category}
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
        totalCount={totalCategoryData}
        dataPerPage={dataPerPage}
        onPageChange={onPageChange}
        onDataPerPageChange={onDataPerPageChange}
        pageSizeOptions={[10, 20, 50, 100]}
        entityLabel="categories"
      />
    </div>
  );
}
