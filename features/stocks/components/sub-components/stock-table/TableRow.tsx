"use client";

import { Info, Pencil, Trash2 } from "lucide-react";
import type { Stock, StockDelete } from "@/features/stocks/stock.types";
import { cn } from "@/shared/lib/utils";
import { formatItemDate } from "@/shared/lib/formatter";
import { useSession } from "next-auth/react";
import { canDeleteItem } from "@/shared/lib/validations/user-access-validation";

const TYPE_BADGE_MAP: Record<string, string> = {
  READY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DIRTY: "bg-amber-50 text-amber-700 border-amber-200",
  DAMAGED: "bg-rose-50 text-rose-700 border-rose-200",
  EXPIRED: "bg-slate-100 text-slate-600 border-slate-300",
};

type TableRowProps = {
  showItemName: boolean;
  stock: Stock;
  onEdit: (stock: Stock) => void;
  onDelete: (stock: StockDelete) => void;
  onInfo: (stockId: string) => void;
};

export default function TableRow({
  showItemName,
  stock,
  onEdit,
  onDelete,
  onInfo,
}: TableRowProps) {
  const { data } = useSession();

  const badgeClass =
    TYPE_BADGE_MAP[stock.type] ?? "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <tr className="border-b border-[#eef4ff] last:border-0 hover:bg-[#f8f9ff]/80">
      {/* Item name */}
      {showItemName && (
        <td className="px-4 py-3 align-middle">
          <p className="truncate font-ochre-ui text-sm font-semibold text-[#121c28]">
            {stock.item.name}
          </p>
        </td>
      )}

      {/* Location */}
      <td className="px-4 py-3 align-middle">
        <span className="inline-flex rounded-md bg-[#121c28] px-2 py-0.5 font-ochre-ui text-xs font-semibold text-white">
          {stock.location?.name ?? "—"}
        </span>
      </td>

      {/* Type badge */}
      <td className="px-4 py-3 align-middle">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 font-ochre-ui text-[10px] font-semibold uppercase tracking-wider",
            badgeClass,
          )}
        >
          {stock.type}
        </span>
      </td>

      {/* Quantity */}
      <td className="px-4 py-3 align-middle font-ochre-ui text-sm font-semibold text-[#121c28] tabular-nums">
        {stock.quantity ? `${stock.quantity?.toLocaleString("id-ID")}` : "-"}
      </td>

      {/* Expired at */}
      <td className="px-4 py-3 align-middle font-ochre-ui text-sm text-[#524439]">
        {stock.expiredAt ? formatItemDate(stock.expiredAt) : "—"}
      </td>

      {/* Updated at */}
      <td className="px-4 py-3 align-middle font-ochre-ui text-sm text-[#524439]">
        {stock.updatedAt ? `${formatItemDate(stock.updatedAt)}` : "-"}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 align-middle text-end">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => onInfo(stock.id)}
            className={cn(
              "rounded-md p-2 outline-none inline-flex items-center justify-center transition-all duration-200 ease-out",
              "bg-transparent text-[#565e74]",
              "hover:-translate-y-0.5 active:translate-y-0",
              "hover:shadow-[0_8px_16px_-6px_rgba(15,23,42,0.08)]",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#894d0d]",
              "hover:bg-[#e5eeff] hover:text-[#121c28]",
            )}
            aria-label={`View details for stock of ${stock.item.name}`}
          >
            <Info className="size-4" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={() => onEdit(stock)}
            className={cn(
              "rounded-md p-2 outline-none inline-flex items-center justify-center transition-all duration-200 ease-out",
              "bg-transparent text-[#565e74]",
              "hover:-translate-y-0.5 active:translate-y-0",
              "hover:shadow-[0_8px_16px_-6px_rgba(15,23,42,0.08)]",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#894d0d]",
              "hover:bg-[#e5eeff] hover:text-[#121c28]",
            )}
            aria-label={`Edit stock for ${stock.item.name}`}
          >
            <Pencil className="size-4" strokeWidth={1.5} />
          </button>

          {data?.user.role && canDeleteItem(data.user.role) && (
            <button
              type="button"
              onClick={() =>
                onDelete({
                  itemName: stock.item.name,
                  stockLocation: stock.location?.name as string,
                  stockId: stock.id,
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
              aria-label={`Delete stock for ${stock.item.name}`}
            >
              <Trash2 className="size-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
