"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { StockRequestListItem } from "../../stock-request.types";
import { useReviewStockRequest } from "../../stock-request.hooks";
import { StockRequestReviewSchema } from "@/shared/lib/zods/stock-request.zod";
import { stockRequestStyles } from "../../stock-request.styles";
import { cn } from "@/shared/lib/utils";

type StockRequestReviewModalProps = {
  open: boolean;
  stockRequest: StockRequestListItem | null;
  onClose: () => void;
};

export default function StockRequestReviewModal({
  open,
  stockRequest,
  onClose,
}: StockRequestReviewModalProps) {
  const [status, setStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [approvedQuantity, setApprovedQuantity] = useState<number>(0);
  const [stockMovementReason, setStockMovementReason] = useState("");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [writeOffDecision, setWriteOffDecision] = useState<string>("DISCARD");
  const [validationError, setValidationError] = useState<string | null>(null);

  const reviewMutation = useReviewStockRequest();

  useEffect(() => {
    if (!open || !stockRequest) return;
    setStatus("APPROVED");
    setApprovedQuantity(stockRequest.requestedQuantity);
    setStockMovementReason(
      `Approved request for ${stockRequest.requestedQuantity} ${stockRequest.item?.name || "units"}.`,
    );
    setDecisionNotes("");
    setWriteOffDecision("DISCARD");
    setValidationError(null);
  }, [open, stockRequest]);

  if (!stockRequest) return null;

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (stockMovementReason.trim().length < 10) {
      setValidationError(
        "Stock movement reason must be at least 10 characters long.",
      );
      return;
    }

    if (status === "APPROVED" && approvedQuantity <= 0) {
      setValidationError("Approved quantity must be greater than 0.");
      return;
    }

    const payload: StockRequestReviewSchema = {
      stockRequestStatus: status,
      stockRequestType: stockRequest.type,
      approvedQuantity: status === "APPROVED" ? approvedQuantity : 0,
      decisitonNotes: decisionNotes.trim() || undefined,
      stockMovementReason: stockMovementReason.trim(),
      writeOffTypeDecision:
        stockRequest.type === "WRITE_OFF"
          ? (writeOffDecision as StockRequestReviewSchema["writeOffTypeDecision"])
          : undefined,
    };

    reviewMutation.mutate(
      { id: stockRequest.id, payload },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  const isWriteOff = stockRequest.type === "WRITE_OFF";

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-xl border-[#d9e3f4] bg-white p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-ochre-brand text-xl font-semibold text-[#894d0d] flex items-center gap-2">
            <CheckCircle2 className="size-5 text-[#894d0d]" />
            Review Stock Request
          </DialogTitle>
          <DialogDescription className="font-ochre-ui text-xs text-[#524439]/80 pt-1">
            Review request for {stockRequest.requestedQuantity}{" "}
            {stockRequest.item?.name} submitted by{" "}
            {stockRequest.requestedBy?.name || "staff"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 font-ochre-ui">
          {validationError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
              {validationError}
            </div>
          )}

          {/* Decision Status Toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#121c28]">
              Review Decision <span className="text-rose-600">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatus("APPROVED");
                  setApprovedQuantity(stockRequest.requestedQuantity);
                  setStockMovementReason(
                    `Approved request for ${stockRequest.requestedQuantity} ${stockRequest.item?.name || "units"}.`,
                  );
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-semibold transition-all",
                  status === "APPROVED"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs"
                    : "border-[#d9e3f4] bg-white text-[#524439] hover:bg-[#f8f9ff]",
                )}
              >
                <CheckCircle2 className="size-4 text-emerald-600" />
                Approve Request
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus("REJECTED");
                  setApprovedQuantity(0);
                  setStockMovementReason(
                    `Rejected request for ${stockRequest.item?.name || "items"}.`,
                  );
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-semibold transition-all",
                  status === "REJECTED"
                    ? "border-rose-600 bg-rose-50 text-rose-800 shadow-xs"
                    : "border-[#d9e3f4] bg-white text-[#524439] hover:bg-[#f8f9ff]",
                )}
              >
                <XCircle className="size-4 text-rose-600" />
                Reject Request
              </button>
            </div>
          </div>

          {/* Approved Quantity (only if Approved) */}
          {status === "APPROVED" && (
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs font-semibold text-[#121c28]">
                  Approved Quantity <span className="text-rose-600">*</span>
                </Label>
                <span className="text-[11px] text-[#524439]/70">
                  Requested: {stockRequest.requestedQuantity}
                </span>
              </div>
              <Input
                type="number"
                min={1}
                value={approvedQuantity || ""}
                onChange={(e) => setApprovedQuantity(Number(e.target.value))}
                required
                className={cn(stockRequestStyles.inputClass, "w-full")}
              />
            </div>
          )}

          {/* Write-off Type Decision (if WRITE_OFF) */}
          {isWriteOff && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#121c28]">
                Write-Off Resolution Type{" "}
                <span className="text-rose-600">*</span>
              </Label>
              <Select
                value={writeOffDecision}
                onValueChange={(val) => setWriteOffDecision(val ?? "DISCARD")}
              >
                <SelectTrigger
                  className={cn(stockRequestStyles.inputClass, "w-full")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISCARD">Discard / Disposal</SelectItem>
                  <SelectItem value="MARK_AS_DAMAGED">
                    Mark as Damaged
                  </SelectItem>
                  <SelectItem value="MARK_AS_LOST">Mark as Lost</SelectItem>
                  <SelectItem value="CONSUME">Consume</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Stock Movement Reason */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#121c28]">
              Stock Movement Reason / Audit Note{" "}
              <span className="text-rose-600">* (min 10 chars)</span>
            </Label>
            <Textarea
              rows={2}
              value={stockMovementReason}
              onChange={(e) => setStockMovementReason(e.target.value)}
              placeholder="Detailed reason for inventory audit logging..."
              required
              className={cn(stockRequestStyles.inputClass, "h-auto py-2")}
            />
          </div>

          {/* Decision Notes (Optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#121c28]">
              Decision Notes (Optional, max 100 chars)
            </Label>
            <Input
              type="text"
              maxLength={100}
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="e.g. Approved with partial quantity due to buffer rules"
              className={cn(stockRequestStyles.inputClass, "w-full")}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={reviewMutation.isPending}
              className="rounded-lg font-ochre-ui border-[#d9e3f4]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={reviewMutation.isPending}
              className={cn(
                "rounded-lg font-ochre-ui text-white",
                status === "APPROVED"
                  ? "bg-[#894d0d] hover:bg-[#a76526]"
                  : "bg-rose-700 hover:bg-rose-800",
              )}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Submitting Review...
                </>
              ) : status === "APPROVED" ? (
                "Confirm Approval"
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
