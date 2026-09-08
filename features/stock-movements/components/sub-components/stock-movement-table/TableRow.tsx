"use client";

import { Eye } from "lucide-react";
import type { StockMovementGetManyApiResponse } from "@/features/stock-movements/stock-movements.types";
import { formatItemDate, formatPrice } from "@/shared/lib/formatter";
import { cn } from "@/shared/lib/utils";
import { movementTone } from "@/features/stock-movements/stock-movements.style";

type StockMovementRow =
  StockMovementGetManyApiResponse["data"]["movements"][number];

type TableRowProps = {
  movement: StockMovementRow;
  index: number;
  onInfo: (movementId: string) => void;
};

function formatMovementType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export default function TableRow({ movement, index, onInfo }: TableRowProps) {
  const isEven = index % 2 === 0;
  const sourceName = movement.sourceLocation?.name ?? "—";
  const destinationName = movement.destinationLocation?.name ?? "—";
  const costLabel =
    movement.totalCost == null
      ? "No cost logged"
      : formatPrice(movement.totalCost);

  return (
    <tr
      className={cn(
        "border-b border-[#eef4ff] transition-colors duration-150",
        isEven ? "bg-[#f8f9ff]/50" : "bg-white",
        "hover:bg-[#f5f8ff]",
      )}
    >
      <td className="px-4 py-3.5 align-middle">
        <div className="min-w-0">
          <p className="truncate font-ochre-ui text-sm font-semibold text-[#121c28]">
            {movement.itemName ?? "Unknown item"}
          </p>
        </div>
      </td>
      <td className="px-4 py-3.5 align-middle">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 font-ochre-ui text-[10px] font-bold uppercase tracking-wider",
            movementTone[movement.type] ??
              "border-[#d9e3f4] bg-[#eef4ff] text-[#565e74]",
          )}
        >
          {formatMovementType(movement.type)}
        </span>
        <p className="mt-1 font-ochre-ui text-xs text-[#524439]/70">
          Qty {movement.quantity}
        </p>
      </td>
      <td className="px-4 py-3.5 align-middle font-ochre-ui text-xs font-medium text-[#121c28]">
        {sourceName}
      </td>
      <td className="px-4 py-3.5 align-middle font-ochre-ui text-xs font-medium text-[#121c28]">
        {destinationName}
      </td>
      <td className="hidden px-4 py-3.5 align-middle md:table-cell">
        <p className="font-ochre-ui text-xs text-[#524439]">
          {formatItemDate(movement.createdAt)}
        </p>
        <p className="mt-0.5 font-ochre-ui text-[11px] text-[#524439]/70">
          {costLabel}
        </p>
      </td>
      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
        <div className="inline-flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onInfo(movement.id)}
            className="inline-flex size-7 items-center justify-center rounded-md border border-[#e5eeff] bg-[#eef4ff] text-[#894d0d] transition-all hover:bg-[#894d0d] hover:text-white shadow-xs focus-visible:outline-2 focus-visible:outline-[#894d0d]"
            title="View Details"
            aria-label={`View movement for ${movement.itemName ?? "item"}`}
          >
            <Eye className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </td>
    </tr>
  );
}
