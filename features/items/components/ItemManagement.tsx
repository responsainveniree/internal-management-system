"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useItems } from "@/features/items/item.hooks";
import type { Item } from "@/features/items/item.types";
import { useCategories } from "@/features/categories/category.hooks";
import ItemFormDialog from "./sub-components/ItemFormDialog";
import ItemDeleteModal from "./sub-components/ItemDeleteModal";
import ItemActiveOrInactiveModal from "./sub-components/ItemActiveOrInactiveModal";
import {
  itemGetManyschema,
  ItemGetManySchema,
} from "@/shared/lib/zods/item.zod";
import ItemInfoPanel from "./sub-components/item-table/ItemInfoPanel";
import StockDeleteModal from "@/features/stocks/components/sub-components/StockDeleteModal";
import StockFormDialog from "@/features/stocks/components/sub-components/StockFormDialog";
import { Stock, StockDelete } from "@/features/stocks/stock.types";
import { useLocations } from "@/features/locations/location.hooks";
import { categoryGetManySchema } from "@/shared/lib/zods/category.zod";
import ItemTable, { ItemTableFilters } from "./sub-components/item-table";
import StockMovementFormDialog from "@/features/stock-movements/components/sub-components/StockMovementFormDialog";
import {
  ItemOption,
  StockMovementFormOpenType,
} from "@/features/stock-movements/stock-movements.types";

type LocationOption = { id: string; name: string };

type ItemManagementProps = {
  locations: LocationOption[];
};

export default function ItemManagement({ locations }: ItemManagementProps) {
  // Item Management part
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<ItemGetManySchema["sortBy"]>("name");
  const [orderBy, setOrderBy] = useState<ItemGetManySchema["orderBy"]>("asc");
  const [dataPerPage, setDataPerPage] = useState(10);
  const [tableFilters, setTableFilters] = useState<ItemTableFilters>({
    search: "",
    categoryId: "ALL",
    activeStatus: undefined,
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [statusChangeItem, setStatusChangeItem] = useState<Item | null>(null);
  const [statusChangeStatus, setStatusChangeStatus] = useState<
    "ACTIVE" | "INACTIVE"
  >("INACTIVE");

  const [selectedGlobalItemStock, setSelectedGlobalItemStock] = useState<
    ItemOption[]
  >([
    {
      id: "",
      name: "",
    },
  ]);
  const [stockMovementFormOpen, setStockMovementFormOpen] =
    useState<boolean>(false);

  const [stockMovementFormOpenType, setStockMovementFormOpenType] =
    useState<StockMovementFormOpenType>("GLOBAL_STOCK");

  useEffect(() => {
    const id = window.setTimeout(
      () => setDebouncedSearch(tableFilters.search),
      350,
    );
    return () => window.clearTimeout(id);
  }, [tableFilters.search]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    sortBy,
    orderBy,
    tableFilters.categoryId,
    tableFilters.activeStatus,
  ]);

  const categoryListParams = useMemo(
    () =>
      categoryGetManySchema.parse({
        page: 1,
        dataPerPage: 100,
        sortBy: "name",
        sortOrder: "asc",
      }),
    [],
  );

  const { data: categoriesResponse } = useCategories(categoryListParams);
  const categoryOptions = categoriesResponse?.data.categories ?? [];

  const params: ItemGetManySchema = useMemo(() => {
    const raw = {
      page,
      dataPerPage,
      isTakeAll: false,
      sortBy,
      orderBy,
      findBy: tableFilters.categoryId !== "ALL" ? "category" : undefined,
      categoryId:
        tableFilters.categoryId !== "ALL" ? tableFilters.categoryId : undefined,
      search:
        debouncedSearch.trim().length >= 3 ? debouncedSearch.trim() : undefined,
      status:
        tableFilters.activeStatus === undefined
          ? undefined
          : tableFilters.activeStatus
            ? "true"
            : "false",
    };
    return itemGetManyschema.parse(raw);
  }, [
    page,
    sortBy,
    orderBy,
    debouncedSearch,
    tableFilters.categoryId,
    tableFilters.activeStatus,
    dataPerPage,
  ]);

  const { data: itemsResponse, isLoading, isError } = useItems(params);

  const dataItems = itemsResponse?.data.items ?? [];
  const totalItems = itemsResponse?.data.totalItems ?? 0;

  const itemOpenCreate = useCallback(() => {
    setEditItem(null);
    setItemFormOpen(true);
  }, []);

  const itemOpenEdit = useCallback((item: Item) => {
    setEditItem(item);
    setItemFormOpen(true);
  }, []);

  const itemOpenDelete = useCallback((item: Item) => {
    setDeleteItem(item);
  }, []);

  const itemOpenStatusChange = useCallback(
    (item: Item, status: "ACTIVE" | "INACTIVE") => {
      setStatusChangeItem(item);
      setStatusChangeStatus(status);
    },
    [],
  );

  const handleItemFormOpenChange = useCallback((open: boolean) => {
    setItemFormOpen(open);
    if (!open) setEditItem(null);
  }, []);

  const handleItemDeleteOpenChange = useCallback((open: boolean) => {
    if (!open) setDeleteItem(null);
  }, []);

  const handleItemStatusChangeOpenChange = useCallback((open: boolean) => {
    if (!open) setStatusChangeItem(null);
  }, []);

  const handleRequestSort = useCallback(
    (column: ItemGetManySchema["sortBy"]) => {
      setSortBy((prevColumn: ItemGetManySchema["sortBy"]) => {
        if (prevColumn === column) {
          setOrderBy((o: string) => (o === "asc" ? "desc" : "asc"));
          return prevColumn;
        }
        setOrderBy("asc");
        return column;
      });
    },
    [],
  );

  const handleToggleSort = useCallback(() => {
    setOrderBy((o: string) => (o === "asc" ? "desc" : "asc"));
  }, []);

  const handleFiltersChange = useCallback(
    (patch: Partial<ItemTableFilters>) => {
      setTableFilters((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const handleFormSuccess = useCallback(() => {
    setEditItem(null);
  }, []);

  const handleDeleteSuccess = useCallback(() => {
    setDeleteItem(null);
  }, []);

  const handleStatusChangeSuccess = useCallback(() => {
    setStatusChangeItem(null);
  }, []);

  // Location data
  const { data: locationsResponse } = useLocations({
    dataPerPage: 100,
    page: 1,
    sortBy: "type",
    sortOrderEnum: "asc",
  });

  const locationData = locationsResponse?.data.locations ?? [];

  const transformLocations = locationData.map((location) => ({
    id: location.id,
    name: location.name,
  }));

  // Stock Modal state and handler
  const [formOpen, setFormOpen] = useState(false);
  const [editStock, setEditStock] = useState<Stock | null>(null);
  const [deleteStock, setDeleteStock] = useState<StockDelete | null>(null);

  const openStockCreate = useCallback(() => {
    setEditStock(null);
    setFormOpen(true);
  }, []);

  const openStockEdit = useCallback((stock: Stock) => {
    setEditStock(stock);
    setFormOpen(true);
  }, []);

  const openStockDelete = useCallback((stock: StockDelete) => {
    setDeleteStock(stock);
  }, []);

  const handleStockFormOpenChange = useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) setEditStock(null);
  }, []);

  const handleStockDeleteOpenChange = useCallback((open: boolean) => {
    if (!open) setDeleteStock(null);
  }, []);

  const handleStockFormSuccess = useCallback(() => {
    setEditStock(null);
  }, []);

  const handleStockDeleteSuccess = useCallback(() => {
    setDeleteStock(null);
  }, []);

  const handleStockMovementFormSuccess = useCallback(() => {
    setStockMovementFormOpen(false);
  }, []);

  return (
    <div className="min-h-0 flex-1 bg-[#f8f9ff] px-4 py-8 md:px-10">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-ochre-brand text-3xl font-medium text-[#894d0d] md:text-4xl">
            Items
          </h1>
          <p className="mt-2 font-ochre-brand text-sm italic leading-relaxed text-[#524439] md:text-base">
            Oversee and manage your luxury asset inventory across all harbor
            locations.
          </p>
        </div>
        <button
          type="button"
          onClick={itemOpenCreate}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 self-start rounded bg-[#894d0d] px-5 py-2.5 font-ochre-ui text-sm font-semibold uppercase tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(137,77,13,0.45)]",
            "transition-[transform,box-shadow] hover:-translate-y-px",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#894d0d]",
          )}
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden />
          New item
        </button>
      </header>

      <div className="mt-8">
        <ItemTable
          items={dataItems}
          totalItems={totalItems}
          isLoading={isLoading}
          isError={isError}
          filters={tableFilters}
          onFiltersChange={handleFiltersChange}
          sortBy={sortBy}
          sortOrder={orderBy}
          onRequestSort={handleRequestSort}
          onToggleSort={handleToggleSort}
          dataPerPage={dataPerPage}
          onDataPerPageChange={setDataPerPage}
          page={page}
          onPageChange={setPage}
          categoryOptions={categoryOptions}
          onInfo={(item: { id: string; name: string }) => setSelectedItem(item)}
          onEdit={itemOpenEdit}
          onStatusChange={itemOpenStatusChange}
          onDelete={itemOpenDelete}
        />
      </div>

      <ItemFormDialog
        open={itemFormOpen}
        onOpenChange={handleItemFormOpenChange}
        item={editItem}
        onSuccess={handleFormSuccess}
        locations={locations}
        categories={categoryOptions}
      />

      <ItemDeleteModal
        open={deleteItem != null}
        onOpenChange={handleItemDeleteOpenChange}
        item={deleteItem}
        onSuccess={handleDeleteSuccess}
      />

      <ItemActiveOrInactiveModal
        open={statusChangeItem != null}
        onOpenChange={handleItemStatusChangeOpenChange}
        item={statusChangeItem}
        onSuccess={handleStatusChangeSuccess}
        status={statusChangeStatus}
      />

      {selectedItem?.id ? (
        <ItemInfoPanel
          key={selectedItem?.id}
          itemId={selectedItem?.id}
          open={selectedItem?.id != null}
          onClose={() => setSelectedItem(null)}
          openStockDelete={openStockDelete}
          openStockEdit={openStockEdit}
          openStockCreate={openStockCreate}
          onSelectedGlobalItemStock={setSelectedGlobalItemStock}
          onOpenStockMovement={setStockMovementFormOpen}
          onStockMovementFormOpenType={setStockMovementFormOpenType}
        />
      ) : null}

      <StockDeleteModal
        onOpenChange={handleStockDeleteOpenChange}
        onSuccess={handleStockDeleteSuccess}
        open={deleteStock != null}
        stock={deleteStock}
      />

      <StockFormDialog
        onOpenChange={handleStockFormOpenChange}
        open={formOpen}
        locations={transformLocations}
        onSuccess={handleStockFormSuccess}
        stock={editStock}
        items={selectedItem?.id ? [selectedItem] : []}
      />

      <StockMovementFormDialog
        items={selectedGlobalItemStock}
        locations={
          stockMovementFormOpenType === "GLOBAL_STOCK" ? [] : locations
        }
        isGlobalStock={true}
        movementTypes={
          stockMovementFormOpenType === "GLOBAL_STOCK"
            ? ["RECEIVE"]
            : ["TRANSFER"]
        }
        onOpenChange={setStockMovementFormOpen}
        open={stockMovementFormOpen}
        onSuccess={handleStockMovementFormSuccess}
        hiddenFields={["stockBatch"]}
      />
    </div>
  );
}
