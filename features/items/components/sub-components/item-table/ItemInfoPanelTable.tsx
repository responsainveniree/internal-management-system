"use client";

import { useState } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Info,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { formatItemDate } from "@/shared/lib/formatter";
import TableHeader from "@/features/stocks/components/sub-components/stock-table/TableHeader";
import { Stock, StockDelete, StockSortBy } from "@/features/stocks/stock.types";
import { StockInItemById } from "@/features/items/item.types";
import { canDeleteItem } from "@/shared/lib/validations/user-access-validation";
import { useSession } from "next-auth/react";
import { StockType } from "@prisma/client";
import StockInfoPanel from "@/features/stocks/components/sub-components/stock-table/StockInfoPanel";

type ItemInfoPanelTableProps = {
  stocks: StockInItemById[];
  totalStockRows: number;
  itemStockPage: number;
  itemStocksPerpage: number;
  sortBy: StockSortBy;
  sortOrder: "asc" | "desc";
  onRequestSort: (column: StockSortBy) => void;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  isError?: boolean;
  openStockEdit: (stock: Stock) => void;
  openStockDelete: (stock: StockDelete) => void;
};

export default function ItemInfoPanelTable({
  stocks,
  totalStockRows,
  itemStockPage,
  itemStocksPerpage,
  onRequestSort,
  sortBy,
  sortOrder,
  onPageChange,
  isLoading = false,
  isError = false,
  openStockDelete,
  openStockEdit,
}: ItemInfoPanelTableProps) {
  const { data: userSession } = useSession();
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [stockPanelOpen, setStockPanelOpen] = useState(false);

  const totalPages = Math.ceil(totalStockRows / itemStocksPerpage);
  const hasNextPage = itemStockPage < totalPages;
  const hasPrevPage = itemStockPage > 1;
  const rangeStart =
    stocks.length === 0 ? 0 : (itemStockPage - 1) * itemStocksPerpage + 1;
  const rangeEnd = (itemStockPage - 1) * itemStocksPerpage + stocks.length;
  const totalShown = totalStockRows;

  if (isError) {
    return (
      <div
        className="rounded-lg border border-[#ffdad6] bg-white px-6 py-10 text-center font-ochre-ui text-sm text-[#93000a] shadow-[0_12px_40px_-18px_rgba(18,28,40,0.08)]"
        role="alert"
      >
        Something went wrong while loading stocks. Please try again.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl border border-[#d9e3f4]/80 bg-white shadow-[0_16px_48px_-20px_rgba(15,23,42,0.08)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 border-collapse">
              <TableHeader
                showItemName={false}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onRequestSort={onRequestSort}
              />
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#eef4ff]">
                      <td className="px-4 py-3" colSpan={5}>
                        <div className="h-10 animate-pulse rounded-md bg-[#eef4ff]/80" />
                      </td>
                    </tr>
                  ))
                ) : stocks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center font-ochre-ui text-sm text-[#524439]"
                    >
                      No stock matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  stocks.map((stock, index) => (
                    <tr
                      key={`${stock?.location?.name ?? "unknown"}-${stock?.type}-${index}`}
                      className="border-b border-[#eef4ff] last:border-0 hover:bg-[#f8f9ff]/40"
                    >
                      <td className="px-4 py-3 font-ochre-ui text-sm text-[#121c28] font-medium">
                        {stock?.location?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-ochre-ui text-xs">
                        <span
                          className={cn(
                            "inline-flex rounded px-1.5 py-0.5 font-semibold text-[10px] uppercase tracking-wide",
                            stock?.type === "READY" &&
                              "bg-emerald-100 text-emerald-800",
                            stock?.type === "DIRTY" &&
                              "bg-amber-100 text-amber-800",
                            stock?.type === "DAMAGED" &&
                              "bg-rose-100 text-rose-800",
                            stock?.type === "EXPIRED" &&
                              "bg-gray-150 text-gray-800 border border-gray-300",
                            stock?.type === "LOST" &&
                              "bg-slate-200 text-slate-800 border border-slate-400",
                          )}
                        >
                          {stock?.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-ochre-ui text-sm text-[#121c28]">
                        {stock?.quantity}
                      </td>
                      <td className="px-4 py-3 font-ochre-ui text-xs text-[#524439]">
                        {stock?.expiredAt
                          ? formatItemDate(stock?.expiredAt)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-ochre-ui text-xs text-[#524439]">
                        {formatItemDate(stock?.updatedAt as Date)}
                      </td>
                      <td className="px-4 py-3 align-middle text-end">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`View stock details for ${stock?.item.name}`}
                            onClick={() => {
                              setSelectedStockId(stock?.id as string);
                              setStockPanelOpen(true);
                            }}
                            className={cn(
                              "rounded-md p-2 outline-none inline-flex items-center justify-center transition-all duration-200 ease-out",
                              "bg-transparent text-[#565e74]",
                              "hover:-translate-y-0.5 active:translate-y-0",
                              "hover:shadow-[0_8px_16px_-6px_rgba(15,23,42,0.08)]",
                              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#894d0d]",
                              "hover:bg-[#fff7f0] hover:text-[#894d0d]",
                            )}
                          >
                            <Info className="size-4" strokeWidth={1.5} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openStockEdit({
                                id: stock?.id as string,
                                item: {
                                  id: stock?.item.id as string,
                                  name: stock?.item.name as string,
                                },
                                expiredAt: stock?.expiredAt as Date,
                                itemId: stock?.item.id as string,
                                location: {
                                  id: stock?.location?.id as string,
                                  name: stock?.location?.name as string,
                                },
                                locationId: stock?.location?.id as string,
                                type: stock?.type as StockType,
                              })
                            }
                            className={cn(
                              "rounded-md p-2 outline-none inline-flex items-center justify-center transition-all duration-200 ease-out",
                              "bg-transparent text-[#565e74]",
                              "hover:-translate-y-0.5 active:translate-y-0",
                              "hover:shadow-[0_8px_16px_-6px_rgba(15,23,42,0.08)]",
                              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#894d0d]",
                              "hover:bg-[#e5eeff] hover:text-[#121c28]",
                            )}
                            aria-label={`Edit stock for ${stock?.item.name}`}
                          >
                            <Pencil className="size-4" strokeWidth={1.5} />
                          </button>

                          {userSession?.user.role &&
                            canDeleteItem(userSession.user.role) && (
                              <button
                                type="button"
                                onClick={() =>
                                  openStockDelete({
                                    itemName: stock?.item.name as string,
                                    stockId: stock?.id as string,
                                    stockLocation: stock?.location
                                      ?.name as string,
                                  })
                                }
                                className={cn(
                                  "rounded-md p-2 outline-none inline-flex items-center justify-center transition-all duration-200 ease-out",
                                  "bg-transparent text-[#565e74]",
                                  "hover:-translate-y-0.5 active:translate-y-0",
                                  "hover:shadow-[0_8px_16px_-6px_rgba(15,23,42,0.08)]",
                                  "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ba1a1a]",
                                  "hover:bg-[#ffdad6]/60 hover:text-[#ba1a1a]",
                                )}
                                aria-label={`Delete stock for ${stock?.item.name}`}
                              >
                                <Trash2 className="size-4" strokeWidth={1.5} />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && totalShown > 0 ? (
            <div className="flex flex-col gap-3 border-t border-[#eef4ff] px-4 py-3 font-ochre-ui text-sm text-[#524439] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing{" "}
                <span className="font-semibold text-[#121c28]">
                  {rangeStart}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-[#121c28]">{rangeEnd}</span>{" "}
                of{" "}
                <span className="font-semibold text-[#121c28]">
                  {totalShown}
                </span>{" "}
                stocks
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!hasPrevPage}
                  onClick={() => onPageChange(1)}
                  className={cn(
                    "rounded-md border border-[#d9e3f4] p-1.5 text-[#565e74]",
                    !hasPrevPage && "cursor-not-allowed opacity-40",
                    hasPrevPage &&
                      "hover:border-[#894d0d]/40 hover:text-[#894d0d]",
                  )}
                  aria-label="First page"
                >
                  <ChevronsLeft className="size-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  disabled={!hasPrevPage}
                  onClick={() => onPageChange(itemStockPage - 1)}
                  className={cn(
                    "rounded-md border border-[#d9e3f4] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#565e74]",
                    !hasPrevPage && "cursor-not-allowed opacity-40",
                    hasPrevPage &&
                      "hover:border-[#894d0d]/40 hover:text-[#894d0d]",
                  )}
                >
                  Prev
                </button>
                <span className="rounded-md bg-[#894d0d] px-3 py-1.5 text-xs font-semibold text-white">
                  {itemStockPage}
                </span>
                <button
                  type="button"
                  disabled={!hasNextPage}
                  onClick={() => onPageChange(itemStockPage + 1)}
                  className={cn(
                    "rounded-md border border-[#d9e3f4] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#565e74]",
                    !hasNextPage && "cursor-not-allowed opacity-40",
                    hasNextPage &&
                      "hover:border-[#894d0d]/40 hover:text-[#894d0d]",
                  )}
                >
                  Next
                </button>
                <button
                  type="button"
                  disabled={!hasNextPage}
                  onClick={() => onPageChange(totalPages)}
                  className={cn(
                    "rounded-md border border-[#d9e3f4] p-1.5 text-[#565e74]",
                    !hasNextPage && "cursor-not-allowed opacity-40",
                    hasNextPage &&
                      "hover:border-[#894d0d]/40 hover:text-[#894d0d]",
                  )}
                  aria-label="Last page"
                >
                  <ChevronsRight className="size-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <StockInfoPanel
        open={stockPanelOpen}
        stockId={selectedStockId ?? ""}
        onClose={() => {
          setStockPanelOpen(false);
          setSelectedStockId(null);
        }}
      />
    </>
  );
}
