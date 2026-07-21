"use client";

import { Eye } from "lucide-react";
import type { StockMovementGetManyApiResponse } from "@/features/stock-movements/stock-movements.types";
import { formatItemDate, formatItemPrice } from "@/shared/lib/formatter";
import { cn } from "@/shared/lib/utils";
import { movementTone } from "@/features/stock-movements/stock-movements.style";

type StockMovementRow =
  StockMovementGetManyApiResponse["data"]["movements"][number];

type TableRowProps = {
  movement: StockMovementRow;
  onInfo: (movementId: string) => void;
};

function formatMovementType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export default function TableRow({ movement, onInfo }: TableRowProps) {
  const sourceName = movement.sourceLocation?.name ?? "-";
  const destinationName = movement.destinationLocation?.name ?? "-";
  const costLabel =
    movement.totalCost == null
      ? "No cost logged"
      : formatItemPrice(movement.totalCost);

  return (
    <tr className="border-b border-[#eef4ff] last:border-0 hover:bg-[#f8f9ff]/80">
      <td className="px-4 py-3 align-middle">
        <div className="min-w-0">
          <p className="truncate font-ochre-ui text-sm font-semibold text-[#121c28]">
            {movement.itemName ?? "Unknown item"}
          </p>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 font-ochre-ui text-[10px] font-semibold uppercase tracking-wider",
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
      <td className="px-4 py-3 align-middle font-ochre-ui text-sm text-[#524439]">
        {sourceName}
      </td>
      <td className="px-4 py-3 align-middle font-ochre-ui text-sm text-[#524439]">
        {destinationName}
      </td>
      <td className="px-4 py-3 align-middle">
        <p className="font-ochre-ui text-sm text-[#524439]">
          {formatItemDate(movement.createdAt)}
        </p>
        <p className="mt-0.5 font-ochre-ui text-xs text-[#524439]/70">
          {costLabel}
        </p>
      </td>
      <td className="px-4 py-3 text-end align-middle">
        <button
          type="button"
          onClick={() => onInfo(movement.id)}
          className={cn(
            "inline-flex items-center justify-center rounded-md p-2 outline-none transition-all duration-200 ease-out",
            "bg-[#eef4ff] text-[#121c28] hover:-translate-y-0.5 hover:bg-[#e5eeff] hover:text-[#894d0d]",
            "focus-visible:ring-2 focus-visible:ring-[#894d0d] focus-visible:ring-offset-2",
          )}
          aria-label={`View movement for ${movement.item?.name ?? "item"}`}
        >
          <Eye className="size-4" strokeWidth={1.5} />
        </button>
      </td>
    </tr>
  );
}
