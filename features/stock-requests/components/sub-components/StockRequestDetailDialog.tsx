"use client";

import { formatTimestamp, cn } from "@/shared/lib/utils";
import {
  Dialog,
  DialogContent,
  // DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Tag,
  MapPin,
  Calendar,
  User,
  UserCheck,
  ClipboardList,
  FileText,
} from "lucide-react";
import {
  getStockRequestStatusBadge,
  getStockRequestTypeBadge,
} from "../../stock-request.utils";
import { StockRequestListItem } from "../../stock-request.types";

type StockRequestDetailDialogProps = {
  open: boolean;
  stockRequest: StockRequestListItem | null;
  onClose: () => void;
};

export default function StockRequestDetailDialog({
  open,
  stockRequest,
  onClose,
}: StockRequestDetailDialogProps) {
  if (!stockRequest) return null;

  const statusBadge = getStockRequestStatusBadge(stockRequest.status);
  const typeBadge = getStockRequestTypeBadge(stockRequest.type);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-xl border-[#d9e3f4] bg-white p-6 shadow-2xl">
        <DialogHeader className="border-b border-[#eef4ff] pb-4 text-left">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-ochre-brand text-2xl font-medium text-[#894d0d] flex items-center gap-2">
              <ClipboardList className="size-6 text-[#894d0d]" />
              {stockRequest.item?.name || "Stock Request Details"}
            </DialogTitle>
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-0.5 font-ochre-ui text-xs font-bold uppercase tracking-wider",
                statusBadge.className,
              )}
            >
              {statusBadge.label}
            </span>
          </div>
          {/* <DialogDescription className="font-ochre-ui text-xs text-[#524439]/80 pt-1">
            Complete details and review log for request ID: {stockRequest.id}
          </DialogDescription> */}
        </DialogHeader>

        <div className="space-y-4 py-2 font-ochre-ui text-xs text-[#524439]">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-[#f8f9ff] p-4 border border-[#eef4ff]">
            <div>
              <span className="text-[#524439]/70 font-medium">
                Requested Quantity
              </span>
              <p className="font-semibold text-[#121c28] text-base">
                {stockRequest.requestedQuantity} units
              </p>
            </div>
            <div>
              <span className="text-[#524439]/70 font-medium">
                Approved Quantity
              </span>
              <p
                className={cn(
                  "font-semibold text-base",
                  stockRequest.approvedQuantity != null
                    ? "text-emerald-700"
                    : "text-[#524439]/50",
                )}
              >
                {stockRequest.approvedQuantity != null
                  ? `${stockRequest.approvedQuantity} units`
                  : "Pending review"}
              </p>
            </div>
          </div>

          <dl className="space-y-3">
            {/* Request Type */}
            <div className="flex justify-between border-b border-[#eef4ff] pb-2">
              <dt className="flex items-center gap-1.5 font-medium text-[#524439]/70">
                <Tag className="size-3.5 text-[#894d0d]" />
                Request Type
              </dt>
              <dd>
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 font-semibold text-[11px]",
                    typeBadge.className,
                  )}
                >
                  {typeBadge.label}
                </span>
              </dd>
            </div>

            {/* Source Location */}
            <div className="flex justify-between border-b border-[#eef4ff] pb-2">
              <dt className="flex items-center gap-1.5 font-medium text-[#524439]/70">
                <MapPin className="size-3.5 text-[#894d0d]" />
                Source Location
              </dt>
              <dd className="font-semibold text-[#121c28]">
                {stockRequest.sourceLocation?.name || "Global / Central Stock"}
              </dd>
            </div>

            {/* Destination Location */}
            <div className="flex justify-between border-b border-[#eef4ff] pb-2">
              <dt className="flex items-center gap-1.5 font-medium text-[#524439]/70">
                <MapPin className="size-3.5 text-[#894d0d]" />
                Destination Location
              </dt>
              <dd className="font-semibold text-[#121c28]">
                {stockRequest.destinationLocation?.name || "—"}
              </dd>
            </div>

            {/* Requested By */}
            <div className="flex justify-between border-b border-[#eef4ff] pb-2">
              <dt className="flex items-center gap-1.5 font-medium text-[#524439]/70">
                <User className="size-3.5 text-[#894d0d]" />
                Requested By
              </dt>
              <dd className="font-semibold text-[#121c28]">
                {stockRequest.requestedBy?.name || "Unknown"}
              </dd>
            </div>

            {/* Approved / Reviewed By */}
            {stockRequest.approvedBy && (
              <div className="flex justify-between border-b border-[#eef4ff] pb-2">
                <dt className="flex items-center gap-1.5 font-medium text-[#524439]/70">
                  <UserCheck className="size-3.5 text-[#894d0d]" />
                  Reviewed By
                </dt>
                <dd className="font-semibold text-[#121c28]">
                  {stockRequest.approvedBy.name}
                </dd>
              </div>
            )}

            {/* Decision Notes */}
            {stockRequest.decisionNotes && (
              <div className="flex justify-between border-b border-[#eef4ff] pb-2">
                <dt className="flex items-center gap-1.5 font-medium text-[#524439]/70">
                  <FileText className="size-3.5 text-[#894d0d]" />
                  Decision Notes
                </dt>
                <dd className="font-semibold text-[#121c28] max-w-64 text-right">
                  {stockRequest.decisionNotes}
                </dd>
              </div>
            )}

            {/* Created At */}
            <div className="flex justify-between border-b border-[#eef4ff] pb-2">
              <dt className="flex items-center gap-1.5 font-medium text-[#524439]/70">
                <Calendar className="size-3.5 text-[#894d0d]" />
                Submitted At
              </dt>
              <dd className="font-semibold text-[#121c28]">
                {formatTimestamp(stockRequest.createdAt)}
              </dd>
            </div>

            {/* Updated At */}
            <div className="flex justify-between border-b border-[#eef4ff] pb-2">
              <dt className="flex items-center gap-1.5 font-medium text-[#524439]/70">
                <Calendar className="size-3.5 text-[#894d0d]" />
                Last Updated
              </dt>
              <dd className="font-semibold text-[#121c28]">
                {formatTimestamp(stockRequest.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}
