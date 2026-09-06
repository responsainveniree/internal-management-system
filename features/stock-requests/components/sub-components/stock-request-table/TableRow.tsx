"use client";

import { useSession } from "next-auth/react";
import { CheckCircle2, Info, Pencil, Trash2 } from "lucide-react";
import { cn, formatTimestamp } from "@/shared/lib/utils";
import { StockRequestListItem } from "@/features/stock-requests/stock-request.types";
import {
  getStockRequestStatusBadge,
  getStockRequestTypeBadge,
} from "@/features/stock-requests/stock-request.utils";
import {
  canDeleteAllStockRequest,
  canDeleteOwnStockRequest,
} from "@/shared/lib/validations/user-access-validation";

type TableRowProps = {
  stockRequest: StockRequestListItem;
  index: number;
  onInfo: (stockRequest: StockRequestListItem) => void;
  onReview: (stockRequest: StockRequestListItem) => void;
  onEdit: (stockRequest: StockRequestListItem) => void;
  onDelete: (stockRequest: StockRequestListItem) => void;
};

export default function TableRow({
  stockRequest,
  index,
  onInfo,
  onReview,
  onEdit,
  onDelete,
}: TableRowProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const currentUserId = session?.user?.id;

  const isEven = index % 2 === 0;
  const statusBadge = getStockRequestStatusBadge(stockRequest.status);
  const typeBadge = getStockRequestTypeBadge(stockRequest.type);
  const isPending = stockRequest.status === "PENDING";
  const isAuthor = stockRequest.requestedBy?.id === currentUserId;

  // Handling role-based action button visibility
  const canReview =
    isPending && (userRole === "HOTEL_MANAGER" || userRole === "SUPERVISOR");

  const canEdit =
    isPending &&
    isAuthor &&
    (userRole === "HOUSEKEEPING" || userRole === "FRONT_DESK");

  const canDelete =
    Boolean(userRole) &&
    (canDeleteAllStockRequest(userRole!) ||
      (canDeleteOwnStockRequest(userRole!) && isAuthor && isPending));

  return (
    <tr
      className={cn(
        "border-b border-[#eef4ff] transition-colors duration-150",
        isEven ? "bg-[#f8f9ff]/50" : "bg-white",
        "hover:bg-[#f5f8ff]",
      )}
    >
      {/* Item Name */}
      <td className="px-4 py-3.5 align-middle">
        <div className="flex flex-col min-w-0">
          <span className="font-ochre-ui font-semibold text-[#121c28] truncate text-sm">
            {stockRequest.item?.name ?? "Unknown Item"}
          </span>
        </div>
      </td>

      {/* Request Type Badge */}
      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 font-ochre-ui text-xs font-semibold",
            typeBadge.className,
          )}
        >
          {typeBadge.label}
        </span>
      </td>

      {/* Quantity */}
      <td className="px-4 py-3.5 align-middle font-ochre-ui text-sm text-[#121c28]">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold">
            {stockRequest.requestedQuantity}
          </span>
          <span className="text-xs text-[#524439]/60">req</span>
          {stockRequest.approvedQuantity != null && (
            <span className="text-xs text-emerald-700 font-medium">
              ({stockRequest.approvedQuantity} app)
            </span>
          )}
        </div>
      </td>

      {/* Status Badge */}
      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 font-ochre-ui text-[10px] font-bold uppercase tracking-wider",
            statusBadge.className,
          )}
        >
          {statusBadge.label}
        </span>
      </td>

      {/* Source Location */}
      <td className="px-4 py-3.5 align-middle font-ochre-ui text-xs font-medium text-[#121c28]">
        {stockRequest.sourceLocation?.name || "Global / Central"}
      </td>

      {/* Destination Location */}
      <td className="px-4 py-3.5 align-middle font-ochre-ui text-xs font-medium text-[#121c28]">
        {stockRequest.destinationLocation?.name || "—"}
      </td>

      {/* Requested By */}
      <td className="px-4 py-3.5 align-middle font-ochre-ui text-xs text-[#524439]">
        {stockRequest.requestedBy?.name || "Unknown"}
      </td>

      {/* Date */}
      <td className="px-4 py-3.5 align-middle font-ochre-ui text-xs text-[#524439] whitespace-nowrap">
        {formatTimestamp(stockRequest.createdAt)}
      </td>

      {/* Action Buttons */}
      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
        <div className="inline-flex items-center justify-end gap-1.5">
          {/* Review Button for Manager/Supervisor */}
          {canReview && (
            <button
              type="button"
              onClick={() => onReview(stockRequest)}
              className="inline-flex items-center gap-1 rounded-md bg-[#894d0d] px-2.5 py-1 font-ochre-ui text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#a76526] active:scale-95 focus-visible:outline-2 focus-visible:outline-[#894d0d]"
              title="Review Request"
            >
              <CheckCircle2 className="size-3.5" />
              Review
            </button>
          )}

          {/* Edit Button for Author Requesters */}
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(stockRequest)}
              className="inline-flex items-center gap-1 rounded-md border border-[#d9e3f4] bg-white px-2.5 py-1 font-ochre-ui text-xs font-medium text-[#565e74] shadow-xs transition-all hover:bg-[#f8f9ff] hover:text-[#121c28] active:scale-95 focus-visible:outline-2 focus-visible:outline-[#894d0d]"
              title="Edit Request"
            >
              <Pencil className="size-3.5" />
              Edit
            </button>
          )}

          {/* Delete Button */}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(stockRequest)}
              className="inline-flex size-7 items-center justify-center rounded-md border border-[#ffdad6] bg-rose-50 text-rose-700 transition-all hover:bg-rose-100 hover:text-rose-900 shadow-xs active:scale-95 focus-visible:outline-2 focus-visible:outline-rose-600"
              title="Delete Request"
              aria-label={`Delete request for ${stockRequest.item?.name}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          )}

          {/* Info Details Trigger */}
          <button
            type="button"
            onClick={() => onInfo(stockRequest)}
            className="inline-flex size-7 items-center justify-center rounded-md border border-[#e5eeff] bg-[#eef4ff] text-[#894d0d] transition-all hover:bg-[#894d0d] hover:text-white shadow-xs focus-visible:outline-2 focus-visible:outline-[#894d0d]"
            title="View Details"
            aria-label={`View details for ${stockRequest.item?.name}`}
          >
            <Info className="size-4" strokeWidth={2} />
          </button>
        </div>
      </td>
    </tr>
  );
}
