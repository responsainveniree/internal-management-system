"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useStocks } from "@/features/stocks/stock.hooks";
import type {
  Stock,
  StockDelete,
  StockGetManyApiResponse,
} from "@/features/stocks/stock.types";
import StockFormDialog from "./sub-components/StockFormDialog";
import StockDeleteModal from "./sub-components/StockDeleteModal";
import { StockGetManySchema } from "@/shared/lib/zods/stock.zod";
import StockTable, { StockTableFilters } from "./sub-components/stock-table";
import StockInfoPanel from "./sub-components/stock-table/StockInfoPanel";

type LocationOption = { id: string; name: string };
type ItemOption = { id: string; name: string };

type StockManagementProps = {
  initialStocks: StockGetManyApiResponse["data"];
  locations: LocationOption[];
  items: ItemOption[];
};

export default function StockManagement({
  initialStocks,
  locations,
  items,
}: StockManagementProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] =
    useState<StockGetManySchema["sortBy"]>("createdAt");
  const [sortOrder, setSortOrder] =
    useState<StockGetManySchema["sortOrder"]>("desc");
  const [dataPerPage, setDataPerPage] = useState(10);
  const [tableFilters, setTableFilters] = useState<StockTableFilters>({
    search: "",
    type: "ALL",
    locationId: "ALL",
    itemId: "ALL",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editStock, setEditStock] = useState<Stock | null>(null);
  const [deleteStock, setDeleteStock] = useState<StockDelete | null>(null);
  const [infoStockId, setInfoStockId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const id = window.setTimeout(
      () => setDebouncedSearch(tableFilters.search),
      350,
    );
    return () => window.clearTimeout(id);
  }, [tableFilters.search]);

  // Reset to page 1 on filter/sort changes
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    sortBy,
    sortOrder,
    tableFilters.type,
    tableFilters.locationId,
    tableFilters.itemId,
  ]);

  const params: StockGetManySchema = useMemo(() => {
    const raw: Record<string, string | undefined> = {
      page: String(page),
      dataPerPage: String(dataPerPage),
      sortBy,
      sortOrder,
      searchQuery:
        debouncedSearch.trim().length >= 3 ? debouncedSearch.trim() : undefined,
      type: tableFilters.type !== "ALL" ? tableFilters.type : undefined,
      locationId:
        tableFilters.locationId !== "ALL" ? tableFilters.locationId : undefined,
      itemId: tableFilters.itemId !== "ALL" ? tableFilters.itemId : undefined,
    };

    // Clean out undefined keys so Zod defaults kick in
    const cleaned = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== undefined),
    );

    return cleaned as unknown as StockGetManySchema;
  }, [
    page,
    dataPerPage,
    sortBy,
    sortOrder,
    debouncedSearch,
    tableFilters.type,
    tableFilters.locationId,
    tableFilters.itemId,
  ]);

  // Check if params match the initial server-fetched defaults
  const isInitialParams =
    page === 1 &&
    dataPerPage === 10 &&
    sortBy === "createdAt" &&
    sortOrder === "desc" &&
    debouncedSearch === "" &&
    tableFilters.type === "ALL" &&
    tableFilters.locationId === "ALL" &&
    tableFilters.itemId === "ALL";

  const {
    data: stocksResponse,
    isLoading,
    isError,
  } = useStocks(params, {
    initialData: isInitialParams
      ? {
          message: "Stocks retrieved successfully",
          data: initialStocks,
          status: 200,
        }
      : undefined,
  });

  const dataStocks = stocksResponse?.data.stocks ?? [];
  const totalCount = stocksResponse?.data.totalCount ?? 0;

  const openCreate = useCallback(() => {
    setEditStock(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((stock: Stock) => {
    setEditStock(stock);
    setFormOpen(true);
  }, []);

  const openDelete = useCallback((stock: StockDelete) => {
    setDeleteStock(stock);
  }, []);

  const handleFormOpenChange = useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) setEditStock(null);
  }, []);

  const handleDeleteOpenChange = useCallback((open: boolean) => {
    if (!open) setDeleteStock(null);
  }, []);

  const handleRequestSort = useCallback(
    (column: StockGetManySchema["sortBy"]) => {
      setSortBy((prevColumn) => {
        if (prevColumn === column) {
          setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
          return prevColumn;
        }
        setSortOrder("asc");
        return column;
      });
    },
    [],
  );

  const handleToggleSort = useCallback(() => {
    setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
  }, []);

  const handleFiltersChange = useCallback(
    (patch: Partial<StockTableFilters>) => {
      setTableFilters((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const handleFormSuccess = useCallback(() => {
    setEditStock(null);
  }, []);

  const handleDeleteSuccess = useCallback(() => {
    setDeleteStock(null);
  }, []);

  return (
    <div className="min-h-0 flex-1 bg-[#f8f9ff] px-4 py-8 md:px-10">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-ochre-brand text-3xl font-medium text-[#894d0d] md:text-4xl">
            Stocks
          </h1>
          <p className="mt-2 font-ochre-brand text-sm italic leading-relaxed text-[#524439] md:text-base">
            Track and manage stock quantities, conditions, and expiration across
            all harbor locations.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 self-start rounded bg-[#894d0d] px-5 py-2.5 font-ochre-ui text-sm font-semibold uppercase tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(137,77,13,0.45)]",
            "transition-[transform,box-shadow] hover:-translate-y-px",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#894d0d]",
          )}
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden />
          New stock
        </button>
      </header>

      <div className="mt-8">
        <StockTable
          stocks={dataStocks}
          totalCount={totalCount}
          isLoading={isLoading}
          isError={isError}
          filters={tableFilters}
          onFiltersChange={handleFiltersChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onRequestSort={handleRequestSort}
          onToggleSort={handleToggleSort}
          dataPerPage={dataPerPage}
          onDataPerPageChange={setDataPerPage}
          page={page}
          onPageChange={setPage}
          locationOptions={locations}
          itemOptions={items}
          onEdit={openEdit}
          onDelete={openDelete}
          onInfo={setInfoStockId}
        />
      </div>

      <StockFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        stock={editStock}
        onSuccess={handleFormSuccess}
        locations={locations}
        items={items}
      />

      <StockDeleteModal
        open={deleteStock != null}
        onOpenChange={handleDeleteOpenChange}
        stock={deleteStock}
        onSuccess={handleDeleteSuccess}
      />

      <StockInfoPanel
        open={infoStockId !== null}
        stockId={infoStockId ?? ""}
        onClose={() => setInfoStockId(null)}
      />
    </div>
  );
}
