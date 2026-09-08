"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export type DataTablePaginationProps = {
  page: number;
  totalCount: number;
  dataPerPage: number;
  onPageChange: (page: number) => void;
  onDataPerPageChange?: (size: number) => void;
  pageSizeOptions?: number[];
  entityLabel?: string;
};

export default function DataTablePagination({
  page,
  totalCount,
  dataPerPage,
  onPageChange,
  onDataPerPageChange,
  pageSizeOptions = [10, 20, 50, 100],
  entityLabel = "records",
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / dataPerPage));
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * dataPerPage + 1;
  const rangeEnd = Math.min(page * dataPerPage, totalCount);

  // Generate intelligent page numbers with ellipsis
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 3) {
      return [1, 2, 3, 4, "ellipsis", totalPages];
    }
    if (page >= totalPages - 2) {
      return [
        1,
        "ellipsis",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 py-2 font-ochre-ui text-xs text-[#524439]">
      <div>
        Showing{" "}
        <span className="font-semibold text-[#121c28]">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        of <span className="font-semibold text-[#121c28]">{totalCount}</span>{" "}
        {entityLabel}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
        {onDataPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-[#524439]">Rows per page:</span>
            <Select
              value={String(dataPerPage)}
              onValueChange={(val) => onDataPerPageChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-18 rounded-md border-[#e5eeff] bg-[#f8f9ff]/80 font-ochre-ui text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent className="gap-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(page - 1)}
                disabled={!hasPrevPage}
                className="h-8 rounded-md border border-[#e5eeff] bg-white text-[#121c28] hover:bg-[#f8f9ff] text-xs font-medium"
              />
            </PaginationItem>

            {pageNumbers.map((p, idx) =>
              p === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis className="size-8" />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    size="default"
                    isActive={p === page}
                    onClick={() => onPageChange(p)}
                    className="size-8 rounded-md border border-[#e5eeff] text-xs"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(page + 1)}
                disabled={!hasNextPage}
                className="h-8 rounded-md border border-[#e5eeff] bg-white text-[#121c28] hover:bg-[#f8f9ff] text-xs font-medium"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
