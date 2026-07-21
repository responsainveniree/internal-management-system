"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Info,
} from "lucide-react";
import { useStockById } from "@/features/stocks/stock.hooks";
import {
  formatItemDate,
  formatThousand,
} from "@/shared/lib/formatter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn, formatTimestamp } from "@/shared/lib/utils";
import { movementTone } from "@/features/stock-movements/stock-movements.style";
import { StockGetByIdSchema } from "@/shared/lib/zods/stock.zod";
import { MovementType } from "@prisma/client";
import StockMovementInfoDialog from "@/features/stock-movements/components/sub-components/StockMovementInfoDialog";

type StockInfoPanelProps = {
  open: boolean;
  stockId: string;
  onClose: () => void;
};

const MOVEMENT_TYPES = [
  "RECEIVE",
  "TRANSFER",
  "CONSUME",
  "SALE",
  "DISCARD",
  "LAUNDRY_OUT",
  "LAUNDRY_IN",
  "ADJUSTMENT",
  "MARK_AS_DAMAGED",
  "MARK_AS_DIRTY",
  "MARK_AS_EXPIRED",
  "MARK_AS_LOST",
];

const TYPE_BADGE_MAP: Record<string, string> = {
  READY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DIRTY: "bg-amber-50 text-amber-700 border-amber-200",
  DAMAGED: "bg-rose-50 text-rose-700 border-rose-200",
  EXPIRED: "bg-slate-100 text-slate-600 border-slate-300",
  LOST: "bg-zinc-50 text-zinc-700 border-zinc-200",
};

function formatMovementType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export default function StockInfoPanel({
  open,
  stockId,
  onClose,
}: StockInfoPanelProps) {
  const [movementPage, setMovementPage] = useState(1);
  const [movementsPerPage, setMovementsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<"createdAt" | "type">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [movementTypeFilter, setMovementTypeFilter] = useState("ALL");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);


  const [activeStockId, setActiveStockId] = useState<string | null>(null);

  useEffect(() => {
    if (open && stockId) {
      setActiveStockId(stockId);
    }
  }, [open, stockId]);

  // Reset page when sorting/filtering changes
  useEffect(() => {
    setMovementPage(1);
  }, [activeStockId, movementsPerPage, sortBy, sortOrder, movementTypeFilter]);

  const params: StockGetByIdSchema = useMemo(() => {
    return {
      page: movementPage,
      dataPerPage: movementsPerPage,
      sortOrder,
      sortBy,
      stockMovementType:
        movementTypeFilter === "ALL"
          ? undefined
          : (movementTypeFilter as MovementType),
    };
  }, [movementPage, movementsPerPage, sortBy, sortOrder, movementTypeFilter]);

  const { data, isLoading, isError } = useStockById(activeStockId ?? "", params, {
    enabled: open && Boolean(activeStockId),
  });

  const stockData = data?.data?.stock;
  const movements = stockData?.movements ?? [];
  const totalMovements = data?.data?.movementsCount ?? 0;

  const totalPages = Math.ceil(totalMovements / movementsPerPage);
  const hasNextPage = movementPage < totalPages;
  const hasPrevPage = movementPage > 1;
  const rangeStart =
    movements.length === 0 ? 0 : (movementPage - 1) * movementsPerPage + 1;
  const rangeEnd = (movementPage - 1) * movementsPerPage + movements.length;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const handleRequestSort = useCallback((column: "createdAt" | "type") => {
    setSortBy((prevColumn) => {
      if (prevColumn === column) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        return prevColumn;
      }
      setSortOrder("asc");
      return column;
    });
  }, []);

  const badgeClass = stockData?.type
    ? (TYPE_BADGE_MAP[stockData.type] ??
      "bg-slate-50 text-slate-600 border-slate-200")
    : "";

  return (
    <><Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[85vh] max-h-[85vh] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-lg border-[#eef4ff] p-0 sm:max-w-4xl md:max-w-6xl data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-4 duration-300 ease-out"
      >
        <DialogHeader className="border-b border-[#eef4ff] px-6 py-5 text-left">
          <DialogTitle className="font-ochre-brand text-2xl font-medium text-[#894d0d]">
            {isLoading
              ? "Stock Details"
              : `${stockData?.item?.name ?? "Stock Details"}`}
          </DialogTitle>
          <DialogDescription className="font-ochre-ui text-sm text-[#524439]/80">
            View detailed stock specifications and movements history logs.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          aria-expanded={showDetails}
          aria-controls="stock-info-collapsible"
          className={cn(
            "mx-6 mt-3 inline-flex w-fit items-center gap-1.5 self-start rounded-md border border-[#e5eeff] bg-[#f8f9ff]/80 px-3 py-1.5 font-ochre-ui text-xs font-semibold uppercase tracking-wide text-[#565e74] shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08)] outline-none transition-all duration-300",
            "hover:-translate-y-px hover:border-[#894d0d]/35 hover:text-[#894d0d] hover:shadow-[0_4px_12px_-2px_rgba(15,23,42,0.12)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#894d0d]"
          )}
        >
          <span>{showDetails ? "Hide details" : "Show details"}</span>
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-300 ease-in-out",
              showDetails ? "rotate-180" : "rotate-0"
            )}
            strokeWidth={2}
            aria-hidden />
        </button>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
          {isError ? (
            <p
              className="font-ochre-ui text-sm text-[#93000a] py-4"
              role="alert"
            >
              Unable to load stock details.
            </p>
          ) : isLoading && !stockData ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 animate-pulse rounded-md bg-[#eef4ff]/80" />
              ))}
            </div>
          ) : stockData ? (
            <div className="space-y-6">
              {/* Collapsible details section */}
              <div
                id="stock-info-collapsible"
                className={cn(
                  "grid overflow-hidden transition-[grid-template-rows] duration-500 ease-in-out",
                  showDetails ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div
                  className={cn(
                    "grid min-h-0 grid-cols-1 md:grid-cols-2 gap-4 items-start transition-opacity duration-300 ease-in-out pb-2",
                    showDetails ? "opacity-100 delay-150" : "opacity-0"
                  )}
                >
                  <div className="rounded-lg border border-[#eef4ff] bg-[#f8f9ff]/50 p-4 col-span-2">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 font-ochre-ui text-xs text-[#524439]">
                      <div className="flex justify-between gap-3 border-b border-[#eef4ff] pb-2">
                        <dt className="text-[#524439]/70 font-medium">
                          Item Name
                        </dt>
                        <dd className="font-semibold text-[#121c28]">
                          {stockData.item.name}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-[#eef4ff] pb-2">
                        <dt className="text-[#524439]/70 font-medium">
                          Location
                        </dt>
                        <dd className="font-semibold text-[#121c28]">
                          {stockData.location?.name ?? "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-[#eef4ff] pb-2">
                        <dt className="text-[#524439]/70 font-medium">
                          Quantity
                        </dt>
                        <dd className="font-semibold text-[#121c28]">
                          {formatThousand(stockData.quantity ?? 0)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-[#eef4ff] pb-2">
                        <dt className="text-[#524439]/70 font-medium">
                          Type / Condition
                        </dt>
                        <dd className="font-semibold">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                              badgeClass
                            )}
                          >
                            {stockData.type}
                          </span>
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-[#eef4ff] pb-2">
                        <dt className="text-[#524439]/70 font-medium">
                          Expiration Date
                        </dt>
                        <dd className="font-semibold text-[#121c28]">
                          {stockData.expiredAt
                            ? formatItemDate(stockData.expiredAt)
                            : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-[#eef4ff] pb-2">
                        <dt className="text-[#524439]/70 font-medium">
                          Created By
                        </dt>
                        <dd className="font-semibold text-[#121c28]">
                          {stockData.creator?.name ?? "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-[#eef4ff] pb-2">
                        <dt className="text-[#524439]/70 font-medium">
                          Created
                        </dt>
                        <dd className="font-semibold text-[#121c28]">
                          {stockData.createdAt
                            ? formatTimestamp(stockData.createdAt)
                            : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-[#eef4ff] pb-2">
                        <dt className="text-[#524439]/70 font-medium">
                          Last Updated
                        </dt>
                        <dd className="font-semibold text-[#121c28]">
                          {stockData.updatedAt
                            ? formatTimestamp(stockData.updatedAt)
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Stock Movements Log section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#eef4ff] pb-2">
                  <h3 className="font-ochre-brand text-lg font-medium text-[#894d0d]">
                    Stock Movements History
                  </h3>
                </div>

                {/* Filter and sorting controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-ochre-ui text-xs font-medium uppercase tracking-wide text-[#524439]/70">
                      Show:
                    </span>
                    <select
                      value={String(movementsPerPage)}
                      onChange={(e) => {
                        setMovementsPerPage(Number(e.target.value));
                      }}
                      className="min-w-24 appearance-none rounded-lg border border-[#e5eeff] bg-[#f8f9ff]/80 px-2 py-1.5 font-ochre-ui text-sm text-[#121c28] outline-none transition-colors duration-200 hover:border-[#b0c8f8] focus:border-[#894d0d]/35 focus:ring-2 focus:ring-[#894d0d]/15 focus:outline-none"
                    >
                      {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-ochre-ui text-xs font-medium uppercase tracking-wide text-[#524439]/70">
                      Filter Type:
                    </span>
                    <select
                      value={movementTypeFilter}
                      onChange={(e) => setMovementTypeFilter(e.target.value)}
                      className="min-w-36 appearance-none rounded-lg border border-[#e5eeff] bg-[#f8f9ff]/80 px-2 py-1.5 font-ochre-ui text-sm text-[#121c28] outline-none transition-colors duration-200 hover:border-[#b0c8f8] focus:border-[#894d0d]/35 focus:ring-2 focus:ring-[#894d0d]/15 focus:outline-none"
                    >
                      <option value="ALL">All Types</option>
                      {MOVEMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {formatMovementType(type)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSortOrder("asc")}
                      className={cn(
                        "rounded-lg border border-[#e5eeff] bg-[#f8f9ff]/80 p-1.5 text-[#565e74] outline-none transition-colors hover:border-[#894d0d]/35 hover:text-[#894d0d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#894d0d]",
                        sortOrder === "asc" &&
                        "border-[#894d0d]/35 text-[#894d0d] ring-2 ring-[#894d0d]/15"
                      )}
                      aria-label="Sort ascending"
                    >
                      <ArrowUp className="size-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortOrder("desc")}
                      className={cn(
                        "rounded-lg border border-[#e5eeff] bg-[#f8f9ff]/80 p-1.5 text-[#565e74] outline-none transition-colors hover:border-[#894d0d]/35 hover:text-[#894d0d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#894d0d]",
                        sortOrder === "desc" &&
                        "border-[#894d0d]/35 text-[#894d0d] ring-2 ring-[#894d0d]/15"
                      )}
                      aria-label="Sort descending"
                    >
                      <ArrowDown className="size-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Movements table */}
                <div className="overflow-hidden rounded-xl border border-[#d9e3f4]/80 bg-white shadow-[0_16px_48px_-20px_rgba(15,23,42,0.08)]">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#d9e3f4] text-left h-12 bg-[#f8f9ff]/50">
                          <th className="px-4 w-12 align-middle text-center font-ochre-ui text-[10px] font-semibold uppercase tracking-wider text-[#524439]/80">
                            No
                          </th>
                          <th
                            onClick={() => handleRequestSort("type")}
                            className="px-4 align-middle font-ochre-ui text-[10px] font-semibold uppercase tracking-wider text-[#524439]/80 cursor-pointer hover:text-[#894d0d]"
                          >
                            <div className="flex items-center gap-1">
                              Type
                              {sortBy === "type" &&
                                (sortOrder === "asc" ? (
                                  <ArrowUp className="size-3" />
                                ) : (
                                  <ArrowDown className="size-3" />
                                ))}
                            </div>
                          </th>
                          <th className="px-4 align-middle text-right font-ochre-ui text-[10px] font-semibold uppercase tracking-wider text-[#524439]/80">
                            Quantity
                          </th>
                          <th className="px-4 align-middle font-ochre-ui text-[10px] font-semibold uppercase tracking-wider text-[#524439]/80">
                            Source
                          </th>
                          <th className="px-4 align-middle font-ochre-ui text-[10px] font-semibold uppercase tracking-wider text-[#524439]/80">
                            Destination
                          </th>
                          <th
                            onClick={() => handleRequestSort("createdAt")}
                            className="px-4 align-middle font-ochre-ui text-[10px] font-semibold uppercase tracking-wider text-[#524439]/80 cursor-pointer hover:text-[#894d0d]"
                          >
                            <div className="flex items-center gap-1">
                              Created At
                              {sortBy === "createdAt" &&
                                (sortOrder === "asc" ? (
                                  <ArrowUp className="size-3" />
                                ) : (
                                  <ArrowDown className="size-3" />
                                ))}
                            </div>
                          </th>
                          <th className="px-4 align-middle font-ochre-ui text-[10px] font-semibold uppercase tracking-wider text-[#524439]/80">
                            Creator
                          </th>
                          <th className="px-4 w-16 align-middle text-center font-ochre-ui text-[10px] font-semibold uppercase tracking-wider text-[#524439]/80">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-b border-[#eef4ff]">
                              <td className="px-4 py-3" colSpan={8}>
                                <div className="h-8 animate-pulse rounded-md bg-[#eef4ff]/80" />
                              </td>
                            </tr>
                          ))
                        ) : movements.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-4 py-12 text-center font-ochre-ui text-sm italic text-[#524439]/60"
                            >
                              No movements history logged for this stock.
                            </td>
                          </tr>
                        ) : (
                          movements.map((m, idx) => {
                            const sourceName = m.sourceLocation?.name ?? "—";
                            const destinationName = m.destinationLocation?.name ?? "—";

                            return (
                              <tr
                                key={m.id}
                                className="border-b border-[#eef4ff] last:border-0 hover:bg-[#f8f9ff]/40 transition-colors duration-200"
                              >
                                <td className="px-4 py-3 text-center align-middle font-ochre-ui text-xs font-medium text-[#524439]/60">
                                  {(movementPage - 1) * movementsPerPage +
                                    idx +
                                    1}
                                </td>
                                <td className="px-4 py-3 align-middle font-ochre-ui text-xs">
                                  <span
                                    className={cn(
                                      "inline-flex rounded border px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wide",
                                      movementTone[m.type] ??
                                      "border-[#d9e3f4] bg-[#eef4ff] text-[#565e74]"
                                    )}
                                  >
                                    {formatMovementType(m.type)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 align-middle text-right font-ochre-ui text-xs font-semibold text-[#121c28]">
                                  {formatThousand(m.quantity ?? 0)}
                                </td>
                                <td className="px-4 py-3 align-middle font-ochre-ui text-xs text-[#524439]">
                                  {sourceName}
                                </td>
                                <td className="px-4 py-3 align-middle font-ochre-ui text-xs text-[#524439]">
                                  {destinationName}
                                </td>
                                <td className="px-4 py-3 align-middle font-ochre-ui text-xs text-[#524439]">
                                  {formatTimestamp(m.createdAt)}
                                </td>
                                <td className="px-4 py-3 align-middle font-ochre-ui text-xs text-[#524439]">
                                  {m.user?.name ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-center align-middle">
                                  <button
                                    type="button"
                                    aria-label="View movement details"
                                    onClick={() => {
                                      setSelectedMovementId(m.id);
                                      setMovementDialogOpen(true);
                                    }}
                                    className="inline-flex items-center justify-center rounded-md border border-[#e5eeff] bg-[#f8f9ff]/80 p-1.5 text-[#565e74] outline-none transition-all duration-200 hover:border-[#894d0d]/35 hover:bg-[#fff7f0] hover:text-[#894d0d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#894d0d]"
                                  >
                                    <Info className="size-3.5" strokeWidth={1.75} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {!isLoading && totalMovements > 0 && (
                    <div className="flex flex-col gap-3 border-t border-[#eef4ff] px-4 py-3 font-ochre-ui text-sm text-[#524439] sm:flex-row sm:items-center sm:justify-between">
                      <p>
                        Showing{" "}
                        <span className="font-semibold text-[#121c28]">
                          {rangeStart}
                        </span>{" "}
                        to{" "}
                        <span className="font-semibold text-[#121c28]">
                          {rangeEnd}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-[#121c28]">
                          {totalMovements}
                        </span>{" "}
                        movements
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!hasPrevPage}
                          onClick={() => setMovementPage(1)}
                          className={cn(
                            "rounded-md border border-[#d9e3f4] p-1.5 text-[#565e74]",
                            !hasPrevPage && "cursor-not-allowed opacity-40",
                            hasPrevPage &&
                            "hover:border-[#894d0d]/40 hover:text-[#894d0d]"
                          )}
                          aria-label="First page"
                        >
                          <ChevronsLeft className="size-4" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          disabled={!hasPrevPage}
                          onClick={() => setMovementPage((p) => p - 1)}
                          className={cn(
                            "rounded-md border border-[#d9e3f4] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#565e74]",
                            !hasPrevPage && "cursor-not-allowed opacity-40",
                            hasPrevPage &&
                            "hover:border-[#894d0d]/40 hover:text-[#894d0d]"
                          )}
                        >
                          Prev
                        </button>
                        <span className="rounded-md bg-[#894d0d] px-3 py-1.5 text-xs font-semibold text-white">
                          {movementPage}
                        </span>
                        <button
                          type="button"
                          disabled={!hasNextPage}
                          onClick={() => setMovementPage((p) => p + 1)}
                          className={cn(
                            "rounded-md border border-[#d9e3f4] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#565e74]",
                            !hasNextPage && "cursor-not-allowed opacity-40",
                            hasNextPage &&
                            "hover:border-[#894d0d]/40 hover:text-[#894d0d]"
                          )}
                        >
                          Next
                        </button>
                        <button
                          type="button"
                          disabled={!hasNextPage}
                          onClick={() => setMovementPage(totalPages)}
                          className={cn(
                            "rounded-md border border-[#d9e3f4] p-1.5 text-[#565e74]",
                            !hasNextPage && "cursor-not-allowed opacity-40",
                            hasNextPage &&
                            "hover:border-[#894d0d]/40 hover:text-[#894d0d]"
                          )}
                          aria-label="Last page"
                        >
                          <ChevronsRight className="size-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
      <StockMovementInfoDialog
        movementId={selectedMovementId}
        open={movementDialogOpen}
        onOpenChange={(nextOpen) => {
          setMovementDialogOpen(nextOpen);
          if (!nextOpen) setSelectedMovementId(null);
        }} /></>
  );
}
