"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { StockRequestListItem } from "../../stock-request.types";
import { useDeleteStockRequest } from "../../stock-request.hooks";

type StockRequestDeleteDialogProps = {
  open: boolean;
  stockRequest: StockRequestListItem | null;
  onClose: () => void;
};

export default function StockRequestDeleteDialog({
  open,
  stockRequest,
  onClose,
}: StockRequestDeleteDialogProps) {
  const deleteMutation = useDeleteStockRequest();

  if (!stockRequest) return null;

  const handleDelete = () => {
    deleteMutation.mutate(stockRequest.id, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md rounded-xl border-[#d9e3f4] bg-white p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-ochre-brand text-xl font-semibold text-rose-700 flex items-center gap-2">
            <Trash2 className="size-5 text-rose-700" />
            Delete Stock Request
          </DialogTitle>
          <DialogDescription className="font-ochre-ui text-xs text-[#524439]/80 pt-1">
            Are you sure you want to delete this stock request for{" "}
            <span className="font-semibold text-[#121c28]">
              {stockRequest.requestedQuantity} {stockRequest.item?.name}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="rounded-lg font-ochre-ui border-[#d9e3f4]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded-lg bg-rose-700 font-ochre-ui text-white hover:bg-rose-800"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" />
                Deleting...
              </>
            ) : (
              "Confirm Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
