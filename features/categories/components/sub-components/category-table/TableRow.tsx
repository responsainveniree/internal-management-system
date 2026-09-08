"use client";

import type { CategoryListItem } from "@/features/categories/category.types";
import { cn } from "@/shared/lib/utils";
import { canDeleteCategory } from "@/shared/lib/validations/user-access-validation";
import { Folder, Info, Pencil, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";

function formatUpdatedAt(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type TableRowProps = {
  category: CategoryListItem;
  index: number;
  onInfo: (categoryId: string) => void;
  onEdit: (category: CategoryListItem) => void;
  onDelete: (category: CategoryListItem) => void;
};

export default function TableRow({
  category,
  index,
  onInfo,
  onEdit,
  onDelete,
}: TableRowProps) {
  const { data } = useSession();
  const isEven = index % 2 === 0;

  return (
    <tr
      className={cn(
        "border-b border-[#eef4ff] transition-colors duration-150",
        isEven ? "bg-[#f8f9ff]/50" : "bg-white",
        "hover:bg-[#f5f8ff]",
      )}
    >
      <td className="px-4 py-3.5 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e5eeff] text-[#565e74]">
            <Folder className="size-4" strokeWidth={1.5} aria-hidden />
          </span>
          <span className="truncate font-ochre-ui text-sm font-semibold text-[#121c28]">
            {category.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5 align-middle">
        <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-[#121c28] px-2.5 py-0.5 font-ochre-ui text-xs font-semibold text-white">
          {category.totalItems}
        </span>
      </td>
      <td className="hidden px-4 py-3.5 align-middle font-ochre-ui text-xs text-[#524439] lg:table-cell">
        {formatUpdatedAt(category.updatedAt)}
      </td>
      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
        <div className="inline-flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onInfo(category.id)}
            className="inline-flex size-7 items-center justify-center rounded-md border border-[#e5eeff] bg-[#eef4ff] text-[#894d0d] transition-all hover:bg-[#894d0d] hover:text-white shadow-xs focus-visible:outline-2 focus-visible:outline-[#894d0d]"
            title="View Details"
            aria-label={`View details for ${category.name}`}
          >
            <Info className="size-4" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={() => onEdit(category)}
            className="inline-flex size-7 items-center justify-center rounded-md border border-[#e5eeff] bg-white text-[#565e74] transition-all hover:bg-[#e5eeff] hover:text-[#121c28] shadow-xs focus-visible:outline-2 focus-visible:outline-[#894d0d]"
            title="Edit Category"
            aria-label={`Edit ${category.name}`}
          >
            <Pencil className="size-4" strokeWidth={1.5} />
          </button>

          {data?.user.role && canDeleteCategory(data.user.role) && (
            <button
              type="button"
              onClick={() => onDelete(category)}
              className="inline-flex size-7 items-center justify-center rounded-md border border-[#ffdad6] bg-rose-50 text-[#ba1a1a] transition-all hover:bg-[#ffdad6] shadow-xs focus-visible:outline-2 focus-visible:outline-[#ba1a1a]"
              title="Delete Category"
              aria-label={`Delete ${category.name}`}
            >
              <Trash2 className="size-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
