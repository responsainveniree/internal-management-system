"use client";

import { useEffect, useId, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  SearchLocationPopover,
  SearchSelectTrigger,
  SearchStockPopover,
} from "@/shared/components/search-components";
import {
  stockRequestUpdateSchema,
  type StockRequestUpdateSchema,
} from "@/shared/lib/zods/stock-request.zod";
import { useUpdateStockRequest } from "../../stock-request.hooks";
import { stockRequestStyles } from "../../stock-request.styles";
import { cn } from "@/shared/lib/utils";
import { Pencil, Loader2 } from "lucide-react";
import { StockRequestListItem } from "../../stock-request.types";

type StockRequestEditDialogProps = {
  open: boolean;
  stockRequest: StockRequestListItem | null;
  onClose: () => void;
};

export default function StockRequestEditDialog({
  open,
  stockRequest,
  onClose,
}: StockRequestEditDialogProps) {
  const formId = useId();
  const updateMutation = useUpdateStockRequest();

  const [stockSearchOpen, setStockSearchOpen] = useState(false);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [selectedStockLabel, setSelectedStockLabel] = useState("");
  const [selectedDestinationName, setSelectedDestinationName] = useState("");

  const form = useForm<StockRequestUpdateSchema>({
    resolver: zodResolver(
      stockRequestUpdateSchema,
    ) as Resolver<StockRequestUpdateSchema>,
    defaultValues: {
      type: "ISSUE",
      requestedQuantity: 1,
      stockId: undefined,
      destinationLocationId: "",
    },
  });

  useEffect(() => {
    if (!open || !stockRequest) return;

    form.reset({
      type: stockRequest.type,
      requestedQuantity: stockRequest.requestedQuantity,
      stockId: undefined,
      destinationLocationId: stockRequest.destinationLocation?.id ?? "",
    });

    setSelectedStockLabel(
      stockRequest.sourceLocation?.name
        ? `${stockRequest.sourceLocation.name} (Existing Source)`
        : "",
    );
    setSelectedDestinationName(stockRequest.destinationLocation?.name ?? "");
  }, [open, stockRequest, form]);

  if (!stockRequest) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        id: stockRequest.id,
        payload: values,
      });
      onClose();
    } catch {
      /* Handled by mutation toast */
    }
  });

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-[#eef4ff] px-6 py-5">
          <DialogTitle className="font-ochre-brand text-2xl font-medium text-[#894d0d] flex items-center gap-2">
            <Pencil className="size-5 text-[#894d0d]" />
            Edit Stock Request
          </DialogTitle>
          <DialogDescription className="font-ochre-ui text-xs text-[#524439]/80 pt-1">
            Updating request for {stockRequest.item?.name}. Changes are only
            permitted while the request is pending review.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5 font-ochre-ui space-y-4"
        >
          {/* Target Item Display */}
          <div>
            <Label className="text-xs font-semibold text-[#121c28]">Item</Label>
            <p className="mt-1 font-ochre-ui text-sm font-semibold text-[#121c28]">
              {stockRequest.item?.name}
            </p>
          </div>

          {/* Change Source Stock Batch (Optional) */}
          <div>
            <Label className="text-xs font-semibold text-[#121c28]">
              Source Stock Batch (Optional change)
            </Label>
            <div className="mt-1.5">
              <SearchStockPopover
                open={stockSearchOpen}
                onOpenChange={setStockSearchOpen}
                selectedId={form.watch("stockId")}
                itemId={stockRequest.item?.id}
                onlyReady
                onSelect={(stock) => {
                  form.setValue("stockId", stock.id, { shouldValidate: true });
                  setSelectedStockLabel(
                    `${stock.location?.name ?? "Location"} - Ready (${stock.quantity} available)`,
                  );
                }}
              >
                <SearchSelectTrigger
                  value={selectedStockLabel}
                  placeholder="Select replacement stock batch..."
                  error={Boolean(form.formState.errors.stockId)}
                />
              </SearchStockPopover>
            </div>
            {form.formState.errors.stockId && (
              <p className="mt-1 text-xs text-rose-600">
                {form.formState.errors.stockId.message}
              </p>
            )}
          </div>

          {/* Destination Location */}
          <div>
            <Label className="text-xs font-semibold text-[#121c28]">
              Destination Location <span className="text-rose-600">*</span>
            </Label>
            <div className="mt-1.5">
              <SearchLocationPopover
                open={locationSearchOpen}
                onOpenChange={setLocationSearchOpen}
                selectedId={form.watch("destinationLocationId")}
                onSelect={(loc) => {
                  setSelectedDestinationName(loc.name);
                  form.setValue("destinationLocationId", loc.id, {
                    shouldValidate: true,
                  });
                }}
              >
                <SearchSelectTrigger
                  value={selectedDestinationName}
                  placeholder="Search and select destination..."
                  error={Boolean(form.formState.errors.destinationLocationId)}
                />
              </SearchLocationPopover>
            </div>
            {form.formState.errors.destinationLocationId && (
              <p className="mt-1 text-xs text-rose-600">
                {form.formState.errors.destinationLocationId.message}
              </p>
            )}
          </div>

          {/* Request Type and Quantity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold text-[#121c28]">
                Request Type <span className="text-rose-600">*</span>
              </Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className={cn(
                        "mt-1.5 w-full",
                        stockRequestStyles.inputClass,
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ISSUE">Issue</SelectItem>
                      <SelectItem value="RESTOCK">Restock</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                      <SelectItem value="SALE">Sale</SelectItem>
                      <SelectItem value="REPORT_LOST">Report Lost</SelectItem>
                      <SelectItem value="WRITE_OFF">Write-Off</SelectItem>
                      <SelectItem value="LAUNDRY_IN">Laundry In</SelectItem>
                      <SelectItem value="LAUNDRY_OUT">Laundry Out</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-[#121c28]">
                Requested Quantity <span className="text-rose-600">*</span>
              </Label>
              <Controller
                control={form.control}
                name="requestedQuantity"
                render={({ field }) => (
                  <Input
                    type="number"
                    min={1}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className={cn("mt-1.5", stockRequestStyles.inputClass)}
                  />
                )}
              />
              {form.formState.errors.requestedQuantity && (
                <p className="mt-1 text-xs text-rose-600">
                  {form.formState.errors.requestedQuantity.message}
                </p>
              )}
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 gap-2 border-t border-[#eef4ff] bg-[#f8f9ff]/50 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-lg font-ochre-ui border-[#d9e3f4]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={updateMutation.isPending}
            className="rounded-lg bg-[#894d0d] font-ochre-ui text-white hover:bg-[#a76526]"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
