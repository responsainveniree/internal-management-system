"use client";

import Image from "next/image";
import { Info, Pencil, PowerIcon, PowerOff } from "lucide-react";
import type { Item } from "@/features/items/item.types";
import { cn } from "@/shared/lib/utils";
import { formatItemDate, formatPrice } from "@/shared/lib/formatter";

type TableRowProps = {
  item: Item;
  index: number;
  onInfo: (item: { id: string; name: string }) => void;
  onEdit: (item: Item) => void;
  onStatusChange: (item: Item, status: "ACTIVE" | "INACTIVE") => void;
  onDelete: (item: Item) => void;
};

export default function TableRow({
  item,
  index,
  onInfo,
  onEdit,
  onStatusChange,
}: TableRowProps) {
  const categoryLabel = item.category?.name ?? "General";
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
          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-[#e5eeff]">
            {item.image ? (
              <Image
                src={item.image}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
                unoptimized
              />
            ) : (
              <span className="flex size-full items-center justify-center font-ochre-ui text-[10px] font-semibold uppercase text-[#565e74]">
                {item.name.slice(0, 2)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-ochre-ui text-sm font-semibold text-[#121c28]">
              {item.name}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 align-middle">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 font-ochre-ui text-[10px] font-bold uppercase tracking-wider",
            item.isActive
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800",
          )}
        >
          {item.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </td>
      <td className="px-4 py-3.5 align-middle">
        <span className="inline-flex rounded-md bg-[#121c28] px-2.5 py-0.5 font-ochre-ui text-xs font-semibold text-white">
          {categoryLabel}
        </span>
      </td>
      <td className="px-4 py-3.5 align-middle font-ochre-ui text-sm font-medium text-[#894d0d]">
        {item.sellingPrice ? formatPrice(item.sellingPrice) : "—"}
      </td>
      <td className="px-4 py-3.5 align-middle font-ochre-ui text-sm font-medium text-[#121c28]">
        {item.costPrice ? formatPrice(item.costPrice) : "—"}
      </td>
      <td className="hidden px-4 py-3.5 align-middle font-ochre-ui text-xs text-[#524439] lg:table-cell">
        {formatItemDate(item.updatedAt)}
      </td>
      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
        <div className="inline-flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onInfo({ id: item.id, name: item.name })}
            className="inline-flex size-7 items-center justify-center rounded-md border border-[#e5eeff] bg-[#eef4ff] text-[#894d0d] transition-all hover:bg-[#894d0d] hover:text-white shadow-xs focus-visible:outline-2 focus-visible:outline-[#894d0d]"
            title="View Details"
            aria-label={`View details for ${item.name}`}
          >
            <Info className="size-4" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex size-7 items-center justify-center rounded-md border border-[#e5eeff] bg-white text-[#565e74] transition-all hover:bg-[#e5eeff] hover:text-[#121c28] shadow-xs focus-visible:outline-2 focus-visible:outline-[#894d0d]"
            title="Edit Item"
            aria-label={`Edit ${item.name}`}
          >
            <Pencil className="size-4" strokeWidth={1.5} />
          </button>

          {item.isActive ? (
            <button
              type="button"
              onClick={() => onStatusChange(item, "INACTIVE")}
              className="inline-flex size-7 items-center justify-center rounded-md border border-[#ffdad6] bg-rose-50 text-rose-700 transition-all hover:bg-rose-100 shadow-xs focus-visible:outline-2 focus-visible:outline-rose-600"
              title="Deactivate Item"
              aria-label={`Deactivate ${item.name}`}
            >
              <PowerOff className="size-3.5" strokeWidth={1.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStatusChange(item, "ACTIVE")}
              className="inline-flex size-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition-all hover:bg-emerald-100 shadow-xs focus-visible:outline-2 focus-visible:outline-emerald-600"
              title="Activate Item"
              aria-label={`Activate ${item.name}`}
            >
              <PowerIcon className="size-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
