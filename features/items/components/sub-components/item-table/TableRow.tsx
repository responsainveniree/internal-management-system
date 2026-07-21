"use client";

import Image from "next/image";
import { Info, Pencil, PowerIcon, PowerOff } from "lucide-react";
import type { Item } from "@/features/items/item.types";
import { cn } from "@/shared/lib/utils";
import { formatItemDate, formatItemPrice } from "@/shared/lib/formatter";

type TableRowProps = {
  item: Item;
  onInfo: (item: { id: string; name: string }) => void;
  onEdit: (item: Item) => void;
  onStatusChange: (item: Item, status: "ACTIVE" | "INACTIVE") => void;
  onDelete: (item: Item) => void;
};

export default function TableRow({
  item,
  onInfo,
  onEdit,
  onStatusChange,
  onDelete,
}: TableRowProps) {
  const categoryLabel = item.category?.name ?? "General";

  return (
    <tr className="border-b border-[#eef4ff] last:border-0 hover:bg-[#f8f9ff]/80">
      <td className="px-4 py-3 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-[#e5eeff]">
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
            {/* <p className="font-ochre-ui text-xs text-[#524439]/70">
              SKU: {formatItemSku(item.id)}
            </p> */}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 font-ochre-ui text-[10px] font-semibold uppercase tracking-wider",
            item.isActive
              ? "bg-emerald-100 text-emerald-800"
              : "bg-rose-100 text-rose-800",
          )}
        >
          {item.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        <span className="inline-flex rounded-md bg-[#121c28] px-2 py-0.5 font-ochre-ui text-xs font-semibold text-white">
          {categoryLabel}
        </span>
      </td>
      <td className="px-4 py-3 align-middle font-ochre-ui text-sm text-[#121c28]">
        {item.sellingPrice ? formatItemPrice(item.sellingPrice) : "-"}
      </td>

      <td className="px-4 py-3 align-middle font-ochre-ui text-sm text-[#524439]">
        {formatItemDate(item.updatedAt)}
      </td>
      <td className="px-4 py-3 align-middle text-end">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => onInfo({ id: item.id, name: item.name })}
            className={cn(
              "rounded-md p-2 outline-none inline-flex items-center justify-center transition-all duration-200 ease-out",
              "bg-[#eef4ff] text-[#121c28] hover:bg-[#e5eeff] hover:text-[#894d0d]",
              "hover:-translate-y-0.5 active:translate-y-0",
              "hover:shadow-[0_8px_16px_-6px_rgba(15,23,42,0.08)]",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#894d0d]",
            )}
            aria-label={`View details for ${item.name}`}
          >
            <Info className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className={cn(
              "rounded-md p-2 outline-none inline-flex items-center justify-center transition-all duration-200 ease-out",
              "bg-transparent text-[#565e74]",
              "hover:-translate-y-0.5 active:translate-y-0",
              "hover:shadow-[0_8px_16px_-6px_rgba(15,23,42,0.08)]",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#894d0d]",
              "hover:bg-[#e5eeff] hover:text-[#121c28]",
            )}
            aria-label={`Edit ${item.name}`}
          >
            <Pencil className="size-4" strokeWidth={1.5} />
          </button>

          {item.isActive ? (
            <button
              type="button"
              onClick={() => {
                onStatusChange(item, "INACTIVE");
              }}
              className={cn(
                "inline-flex items-center justify-center rounded-md p-2 outline-none transition-all duration-200 ease-out",
                "bg-transparent text-[#565e74]",
                "hover:-translate-y-0.5 hover:bg-[#565e74]/10 hover:text-[#1e2538] active:translate-y-0",
                "hover:shadow-[0_8px_16px_-6px_rgba(15,23,42,0.08)]",
                "focus-visible:ring-2 focus-visible:ring-[#ba1a1a] focus-visible:ring-offset-2",
              )}
              aria-label={`inactive ${item.name}`}
            >
              <PowerOff className="size-4" strokeWidth={1.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onStatusChange(item, "ACTIVE");
              }}
              className={cn(
                "inline-flex items-center justify-center rounded-md p-2 outline-none transition-all duration-200 ease-out",
                "bg-transparent text-[#565e74]",
                "hover:-translate-y-0.5 hover:bg-emerald-500/10 hover:text-emerald-700 active:translate-y-0",
                "hover:shadow-[0_8px_16px_-6px_rgba(15,23,42,0.08)]",
                "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
              )}
              aria-label={`Activate ${item.name}`}
            >
              <PowerIcon className="size-4" strokeWidth={1.5} />
            </button>
          )}

          {/* Turn off delete feature for a while, can be re-activated in the future  */}
          {/* {!item.isActive &&
            data?.user.role &&
            canDeleteItem(data?.user.role) && (
              <button
                type="button"
                onClick={() => {
                  onDelete(item);
                }}
                className={cn(
                  "rounded-md p-2 outline-none inline-flex items-center justify-center transition-all duration-200 ease-out",
                  "bg-transparent text-[#565e74]",
                  "hover:-translate-y-0.5 active:translate-y-0",
                  "hover:shadow-[0_8px_16px_-6px_rgba(15,23,42,0.08)]",
                  "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ba1a1a]",
                  "hover:bg-[#ffdad6]/60 hover:text-[#ba1a1a]",
                )}
                aria-label={`Delete ${item.name}`}
              >
                <Trash2 className="size-4" strokeWidth={1.5} />
              </button>
            )} */}
        </div>
      </td>
    </tr>
  );
}
