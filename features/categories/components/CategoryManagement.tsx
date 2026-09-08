"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  categoryGetManySchema,
  type CategoryCreateSchema,
  type CategoryGetManySchema,
  type CategoryUpdateSchema,
} from "@/shared/lib/zods/category.zod";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/features/categories/category.hooks";
import type { CategoryListItem } from "@/features/categories/category.types";
import CategoryFormDialog from "./sub-components/CategoryFormDialog";
import CategoryDeleteModal from "./sub-components/CategoryDeleteModal";
import CategoryInfoPanel from "./sub-components/category-table/CategoryInfoPanel";
import type { CategorySortBy } from "./sub-components/category-table/TableHeader";
import CategoryTable from "./sub-components/category-table/index";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

export default function CategoryManagement() {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] =
    useState<CategoryGetManySchema["sortBy"]>("createdAt");
  const [sortOrder, setSortOrder] =
    useState<CategoryGetManySchema["sortOrder"]>("desc");
  const [itemDataPerPage, setItemDataPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "update">("create");
  const [editTarget, setEditTarget] = useState<CategoryListItem | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryListItem | null>(
    null,
  );

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortBy, sortOrder]);

  const filters: CategoryGetManySchema = useMemo(() => {
    const raw = {
      page,
      dataPerPage: itemDataPerPage,
      sortBy,
      sortOrder,
      ...(debouncedSearch.trim().length >= 3
        ? { search: debouncedSearch.trim() }
        : {}),
    };
    return categoryGetManySchema.parse(raw);
  }, [page, sortBy, sortOrder, itemDataPerPage, debouncedSearch]);

  const { data, isLoading, isError } = useCategories(filters);

  const categories = data?.data.categories;
  const totalCategoryData = data?.data.totalCategoryData;

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const openCreate = useCallback(() => {
    setFormMode("create");
    setEditTarget(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((c: CategoryListItem) => {
    setFormMode("update");
    setEditTarget(c);
    setFormOpen(true);
  }, []);

  const openDelete = useCallback((c: CategoryListItem) => {
    setDeleteTarget(c);
    setDeleteOpen(true);
  }, []);

  const closeForm = useCallback(() => setFormOpen(false), []);

  const closeDelete = useCallback(() => {
    setDeleteOpen(false);
    setDeleteTarget(null);
  }, []);

  const handleRequestSort = useCallback((column: CategorySortBy) => {
    setSortBy((prevColumn) => {
      if (prevColumn === column) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        return prevColumn;
      }
      setSortOrder(column === "createdAt" ? "desc" : "asc");
      return column;
    });
  }, []);

  const handleCreate = async (values: CategoryCreateSchema) => {
    try {
      await createMutation.mutateAsync(values);
      closeForm();
    } catch {
      /* errors surfaced by API client */
    }
  };

  const handleUpdate = async (values: CategoryUpdateSchema) => {
    if (!editTarget?.id) {
      toast.error("Category id is missing. Try again.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        categoryId: editTarget.id,
        payload: values,
      });
      closeForm();
    } catch {
      /* errors surfaced by API client */
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      closeDelete();
    } catch {
      /* errors surfaced by API client */
    }
  };

  // const handleImportPlaceholder = useCallback(() => {
  //   toast.message("Import data will be available in a future release.");
  // }, []);

  return (
    <div className="min-h-screen flex-1 bg-[#f8f9ff] px-4 py-8 md:px-10 ">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-ochre-brand text-3xl font-medium text-[#894d0d] md:text-4xl">
            Categories
          </h1>
          <p className="mt-2 font-ochre-ui text-sm leading-relaxed text-[#524439] md:text-base">
            Organize inventory into clear groups so your team can find items
            faster, keep stock accurate, and report with confidence.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 self-start rounded-md bg-[#894d0d] px-4 py-2.5 font-ochre-ui text-sm font-semibold text-white shadow-sm",
            "transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-[0_12px_28px_-10px_rgba(137,77,13,0.35)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#894d0d]",
          )}
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden />
          New category
        </button>
      </header>

      <div className="mt-8">
        <CategoryTable
          totalCategoryData={totalCategoryData ?? 0}
          categories={categories ?? []}
          isLoading={isLoading}
          isError={isError}
          filters={{
            searchQuery: searchInput,
          }}
          onFiltersChange={(patch) => {
            if (patch.searchQuery !== undefined) {
              setSearchInput(patch.searchQuery);
            }
          }}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onRequestSort={handleRequestSort}
          page={page}
          dataPerPage={itemDataPerPage}
          onPageChange={setPage}
          onDataPerPageChange={setItemDataPerPage}
          onEdit={openEdit}
          onDelete={openDelete}
          onInfo={(categoryId) => setSelectedCategoryId(categoryId)}
        />
      </div>

      <CategoryFormDialog
        open={formOpen}
        mode={formMode}
        category={editTarget}
        isSubmitting={
          formMode === "create"
            ? createMutation.isPending
            : updateMutation.isPending
        }
        onClose={closeForm}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <CategoryDeleteModal
        open={deleteOpen}
        categoryName={deleteTarget?.name ?? ""}
        itemCount={deleteTarget?.totalItems ?? 0}
        isDeleting={deleteMutation.isPending}
        onClose={closeDelete}
        onConfirm={handleConfirmDelete}
      />

      <CategoryInfoPanel
        open={selectedCategoryId !== null}
        categoryId={selectedCategoryId ?? ""}
        onClose={() => setSelectedCategoryId(null)}
      />
    </div>
  );
}
