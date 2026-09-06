"use client";

import { useId, useState } from "react";
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
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  SearchItemPopover,
  SearchLocationPopover,
  SearchSelectTrigger,
  SearchStockPopover,
} from "@/shared/components/search-components";
import {
  stockRequestCreateSchema,
  type StockRequestCreateSchema,
} from "@/shared/lib/zods/stock-request.zod";
import { useCreateStockRequest } from "../../stock-request.hooks";
import { stockRequestStyles } from "../../stock-request.styles";
import { cn } from "@/shared/lib/utils";
import { ClipboardList, Loader2 } from "lucide-react";

type StockRequestCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export default function StockRequestCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: StockRequestCreateDialogProps) {
  const formId = useId();
  const createMutation = useCreateStockRequest();

  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [stockSearchOpen, setStockSearchOpen] = useState(false);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [selectedStockLabel, setSelectedStockLabel] = useState("");
  const [selectedDestinationName, setSelectedDestinationName] = useState("");

  const form = useForm<StockRequestCreateSchema>({
    resolver: zodResolver(
      stockRequestCreateSchema,
    ) as Resolver<StockRequestCreateSchema>,
    defaultValues: {
      itemId: "",
      stockId: "",
      destinationLocationId: "",
      requestType: "ISSUE",
      quantity: 1,
      reason: "",
    },
  });

  const selectedItemId = form.watch("itemId");

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      form.reset();
      setSelectedItemName("");
      setSelectedStockLabel("");
      setSelectedDestinationName("");
      onOpenChange(false);
      onSuccess();
    } catch {
      /* Handled by mutation error notification */
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-[#eef4ff] px-6 py-5">
          <DialogTitle className="font-ochre-brand text-2xl font-medium text-[#894d0d] flex items-center gap-2">
            <ClipboardList className="size-6 text-[#894d0d]" />
            New Stock Request
          </DialogTitle>
          <DialogDescription className="font-ochre-ui text-xs text-[#524439]/80 pt-1">
            Submit a request for items from inventory storage to a department or
            destination location.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5 font-ochre-ui space-y-4"
        >
          {/* Item Selector */}
          <div>
            <Label className="text-xs font-semibold text-[#121c28]">
              Target Item <span className="text-rose-600">*</span>
            </Label>
            <div className="mt-1.5">
              <SearchItemPopover
                open={itemSearchOpen}
                onOpenChange={setItemSearchOpen}
                selectedId={selectedItemId}
                onSelect={(item) => {
                  setSelectedItemName(item.name);
                  form.setValue("itemId", item.id, { shouldValidate: true });
                  form.setValue("stockId", "");
                  setSelectedStockLabel("");
                }}
              >
                <SearchSelectTrigger
                  value={selectedItemName}
                  placeholder="Search and select item..."
                  error={Boolean(form.formState.errors.itemId)}
                />
              </SearchItemPopover>
            </div>
            {form.formState.errors.itemId && (
              <p className="mt-1 text-xs text-rose-600">
                {form.formState.errors.itemId.message}
              </p>
            )}
          </div>

          {/* Source Stock Batch */}
          <div>
            <Label className="text-xs font-semibold text-[#121c28]">
              Source Stock Batch <span className="text-rose-600">*</span>
            </Label>
            <div className="mt-1.5">
              <SearchStockPopover
                open={stockSearchOpen}
                onOpenChange={setStockSearchOpen}
                selectedId={form.watch("stockId")}
                itemId={selectedItemId}
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
                  placeholder={
                    selectedItemId
                      ? "Select available ready stock batch..."
                      : "Select an item first..."
                  }
                  disabled={!selectedItemId}
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
                name="requestType"
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
                      <SelectItem value="ISSUE">
                        Issue (Standard Consumption)
                      </SelectItem>
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
                name="quantity"
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
              {form.formState.errors.quantity && (
                <p className="mt-1 text-xs text-rose-600">
                  {form.formState.errors.quantity.message}
                </p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <Label className="text-xs font-semibold text-[#121c28]">
              Reason for Request{" "}
              <span className="text-rose-600">* (min 10 characters)</span>
            </Label>
            <Textarea
              rows={3}
              placeholder="e.g. Restocking Housekeeping Cart 2 for weekend turnover..."
              className={cn(
                "mt-1.5",
                stockRequestStyles.inputClass,
                "h-auto py-2",
              )}
              {...form.register("reason")}
            />
            {form.formState.errors.reason && (
              <p className="mt-1 text-xs text-rose-600">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter className="shrink-0 gap-2 border-t border-[#eef4ff] bg-[#f8f9ff]/50 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg font-ochre-ui border-[#d9e3f4]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={createMutation.isPending}
            className="rounded-lg bg-[#894d0d] font-ochre-ui text-white hover:bg-[#a76526]"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
