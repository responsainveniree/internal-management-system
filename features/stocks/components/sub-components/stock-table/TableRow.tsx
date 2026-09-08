"use client";

import { Info, Pencil, Trash2 } from "lucide-react";
import type { Stock, StockDelete } from "@/features/stocks/stock.types";
import { cn } from "@/shared/lib/utils";
import { formatItemDate } from "@/shared/lib/formatter";
import { useSession } from "next-auth/react";
import { canDeleteItem } from "@/shared/lib/validations/user-access-validation";

const TYPE_BADGE_MAP: Record<string, string> = {
  READY: "border-emerald-200 bg-emerald-50 text-emerald-700",
  DIRTY: "border-amber-200 bg-amber-50 text-amber-700",
  DAMAGED: "border-rose-200 bg-rose-50 text-rose-700",
  EXPIRED: "border-slate-300 bg-slate-100 text-slate-600",
};

type TableRowProps = {
  showItemName: boolean;
  stock: Stock;
  index: number;
  onEdit: (stock: Stock) => void;
  onDelete: (stock: StockDelete) => void;
  onInfo: (stockId: string) => void;
};

export default function TableRow({
  showItemName,
  stock,
  index,
  onEdit,
  onDelete,
  onInfo,
}: TableRowProps) {
  const { data } = useSession();
  const isEven = index % 2 === 0;

  const badgeClass =
    TYPE_BADGE_MAP[stock.type] ?? "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <tr
      className={cn(
        "border-b border-[#eef4ff] transition-colors duration-150",
        isEven ? "bg-[#f8f9ff]/50" : "bg-white",
        "hover:bg-[#f5f8ff]",
      )}
    >
      {/* Item name */}
      {showItemName && (
        <td className="px-4 py-3.5 align-middle">
          <p className="truncate font-ochre-ui text-sm font-semibold text-[#121c28]">
            {stock.item.name}
          </p>
        </td>
      )}

      {/* Location */}
      <td className="px-4 py-3.5 align-middle">
        <span className="inline-flex rounded-md bg-[#121c28] px-2.5 py-0.5 font-ochre-ui text-xs font-semibold text-white">
          {stock.location?.name ?? "—"}
        </span>
      </td>

      {/* Type badge */}
      <td className="px-4 py-3.5 align-middle">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 font-ochre-ui text-[10px] font-bold uppercase tracking-wider",
            badgeClass,
          )}
        >
          {stock.type}
        </span>
      </td>

      {/* Quantity */}
      <td className="px-4 py-3.5 align-middle font-ochre-ui text-sm font-semibold text-[#121c28] tabular-nums">
        {stock.quantity != null
          ? `${stock.quantity.toLocaleString("id-ID")}`
          : "—"}
      </td>

      {/* Expired at */}
      <td className="hidden px-4 py-3.5 align-middle font-ochre-ui text-xs text-[#524439] md:table-cell">
        {stock.expiredAt ? formatItemDate(stock.expiredAt) : "—"}
      </td>

      {/* Updated at */}
      <td className="hidden px-4 py-3.5 align-middle font-ochre-ui text-xs text-[#524439] lg:table-cell">
        {stock.updatedAt ? formatItemDate(stock.updatedAt) : "—"}
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
        <div className="inline-flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onInfo(stock.id)}
            className="inline-flex size-7 items-center justify-center rounded-md border border-[#e5eeff] bg-[#eef4ff] text-[#894d0d] transition-all hover:bg-[#894d0d] hover:text-white shadow-xs focus-visible:outline-2 focus-visible:outline-[#894d0d]"
            title="View Details"
            aria-label={`View details for stock of ${stock.item.name}`}
          >
            <Info className="size-4" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={() => onEdit(stock)}
            className="inline-flex size-7 items-center justify-center rounded-md border border-[#e5eeff] bg-white text-[#565e74] transition-all hover:bg-[#e5eeff] hover:text-[#121c28] shadow-xs focus-visible:outline-2 focus-visible:outline-[#894d0d]"
            title="Edit Stock"
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
              className="inline-flex size-7 items-center justify-center rounded-md border border-[#ffdad6] bg-rose-50 text-[#ba1a1a] transition-all hover:bg-[#ffdad6] shadow-xs focus-visible:outline-2 focus-visible:outline-[#ba1a1a]"
              title="Delete Stock"
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
