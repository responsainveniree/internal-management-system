"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
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
} from "@/shared/components/ui/select";
import { cn } from "@/shared/lib/utils";
import { useStocks } from "@/features/stocks/stock.hooks";
import {
  stockMovementCreateSchema,
  type StockMovementCreateSchema,
} from "@/shared/lib/zods/stock-movements.zod";
import { stockGetManySchema } from "@/shared/lib/zods/stock.zod";
import { useCreateStockMovement } from "../../stock-movements.hooks";
import {
  datePickerInputClass,
  stockMovementInputClass,
} from "../../stock-movements.style";
import { StockType } from "@prisma/client";
import { formatThousand, unformatThousand } from "@/shared/lib/formatter";
import { Calendar, Keyboard } from "lucide-react";

type ItemOption = { id: string; name: string };
type LocationOption = { id: string; name: string };
type MovementTypeOption = StockMovementCreateSchema["stockMovementType"];

type StockMovementFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  items: ItemOption[];
  locations: LocationOption[];
  isGlobalStock?: boolean;
  neededDatePicker?: boolean;
  movementTypes: MovementTypeOption[];
  hiddenFields?: ("stockBatch" | "itemId" | "movementType")[];
};

const stockRequiredTypes = new Set<MovementTypeOption>([
  "TRANSFER",
  "ADJUSTMENT",
  "MARK_AS_DAMAGED",
  "MARK_AS_DIRTY",
  "MARK_AS_LOST",
  "MARK_AS_EXPIRED",
  "CONSUME",
  "SALE",
  "LAUNDRY_OUT",
  "LAUNDRY_IN",
  "DISCARD",
  "RECEIVE",
  "LAUNDRY_IN",
]);

const typeShowReadyStocks = new Set<MovementTypeOption>(["CONSUME", "SALE"]);

const markAsTypes = new Set<MovementTypeOption>([
  "MARK_AS_DAMAGED",
  "MARK_AS_DIRTY",
  "MARK_AS_EXPIRED",
  "MARK_AS_LOST",
]);

const destinationRequiredTypes = new Set<MovementTypeOption>(["TRANSFER"]);

const totalCostRequiredTypes = new Set<MovementTypeOption>([
  "DISCARD",
  "SALE",
  "LAUNDRY_OUT",
]);

function formatMovementLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export default function StockMovementFormDialog({
  open,
  onOpenChange,
  onSuccess,
  items,
  locations,
  movementTypes,
  hiddenFields,
  isGlobalStock,
}: StockMovementFormDialogProps) {
  const formId = useId();
  const createMutation = useCreateStockMovement();
  const [expiryInputMode, setExpiryInputMode] = useState<"picker" | "manual">(
    "picker",
  );

  const defaultType =
    movementTypes.length === 1 && movementTypes[0] === "TRANSFER"
      ? "TRANSFER"
      : "RECEIVE";

  const form = useForm<StockMovementCreateSchema>({
    resolver: zodResolver(
      stockMovementCreateSchema,
    ) as Resolver<StockMovementCreateSchema>,
    defaultValues: {
      itemId: "",
      stockId: undefined,
      isGlobalStock: isGlobalStock ?? undefined,
      stockMovementType: defaultType,
      quantity: undefined,
      totalCost: undefined,
      reason: "",
      destinationLocationId: undefined,
      orderId: undefined,
      expiredAt: undefined,
    },
  });

  const selectedItemId = form.watch("itemId");
  const selectedStockId = form.watch("stockId");
  const selectedMovementType = form.watch("stockMovementType");
  const requiresStock = stockRequiredTypes.has(selectedMovementType);
  const requiresDestination =
    destinationRequiredTypes.has(selectedMovementType);
  const requiresTotalCost = totalCostRequiredTypes.has(selectedMovementType);

  const stockParams = useMemo(
    () =>
      stockGetManySchema.parse({
        page: 1,
        dataPerPage: 100,
        sortBy: "createdAt",
        sortOrder: "asc",
        itemId: selectedItemId || undefined,
      }),
    [selectedItemId],
  );

  const { data: stocksResponse } = useStocks(stockParams, {
    enabled: open && requiresStock && selectedItemId.length > 0,
  });

  let stockOptions = stocksResponse?.data.stocks ?? [];
  const selectedStock = stockOptions.find(
    (stock) => stock.id === selectedStockId,
  );

  if (typeShowReadyStocks.has(selectedMovementType)) {
    stockOptions = stockOptions.filter((stock) => stock.type === "READY");
  }

  if (markAsTypes.has(selectedMovementType)) {
    let avoidedType: StockType;

    if (selectedMovementType === "MARK_AS_DAMAGED") {
      avoidedType = "DAMAGED";
    }
    if (selectedMovementType === "MARK_AS_DIRTY") {
      avoidedType = "DIRTY";
    }
    if (selectedMovementType === "MARK_AS_EXPIRED") {
      avoidedType = "EXPIRED";
    }
    if (selectedMovementType === "MARK_AS_LOST") {
      avoidedType = "LOST";
    }

    stockOptions = stockOptions.filter((stock) => stock.type !== avoidedType);
  }

  useEffect(() => {
    if (!open) return;

    form.reset({
      itemId: items[0]?.id ?? "",
      stockId: undefined,
      stockMovementType: defaultType,
      isGlobalStock: isGlobalStock ?? undefined,
      quantity: undefined,
      totalCost: undefined,
      reason: "",
      destinationLocationId: locations[0]?.id,
      orderId: undefined,
    });
  }, [form, items, locations, open]);

  useEffect(() => {
    if (!requiresStock) {
      form.setValue("stockId", undefined);
      return;
    }
  }, [form, requiresStock, selectedStock]);

  useEffect(() => {
    if (requiresDestination) {
      form.setValue(
        "destinationLocationId",
        form.getValues("destinationLocationId") ?? locations[0]?.id,
        { shouldValidate: true },
      );
    } else {
      form.setValue("destinationLocationId", undefined);
    }
  }, [form, locations, requiresDestination]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = stockMovementCreateSchema.parse({
      ...values,
      stockId: requiresStock ? values.stockId : undefined,
      destinationLocationId: requiresDestination
        ? values.destinationLocationId
        : undefined,
      totalCost: values.totalCost,
    });

    try {
      await createMutation.mutateAsync(payload);
      onOpenChange(false);
      onSuccess();
    } catch {
      /* handled by API interceptor */
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-[#eef4ff] px-6 py-5">
          <DialogTitle className="font-ochre-brand text-2xl font-medium text-[#894d0d]">
            New stock movement
          </DialogTitle>
        </DialogHeader>

        <form
          id={formId}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5"
          onSubmit={onSubmit}
        >
          <fieldset className="space-y-4">
            <legend className="font-ochre-ui text-[11px] font-semibold uppercase tracking-wider text-[#524439]">
              Movement details
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="font-ochre-ui text-sm">Item</Label>
                {(() => {
                  const selectedId = form.watch("itemId");
                  return (
                    <Select
                      value={selectedId}
                      onValueChange={(value) => {
                        form.setValue("itemId", value ?? "", {
                          shouldValidate: true,
                        });
                        form.setValue("stockId", undefined);
                      }}
                    >
                      <SelectTrigger
                        className={cn("mt-1.5 w-full", stockMovementInputClass)}
                      >
                        {selectedId
                          ? (items.find((item) => item.id === selectedId)
                              ?.name ?? "Select an item")
                          : "Select an item"}
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
                {form.formState.errors.itemId ? (
                  <p className="mt-1 font-ochre-ui text-xs text-red-600">
                    {form.formState.errors.itemId.message}
                  </p>
                ) : null}
              </div>

              <div>
                <Label className="font-ochre-ui text-sm">Movement type</Label>
                <Select
                  value={selectedMovementType}
                  onValueChange={(value) => {
                    form.setValue(
                      "stockMovementType",
                      value as MovementTypeOption,
                      {
                        shouldValidate: true,
                      },
                    );
                    form.setValue("stockId", undefined);
                  }}
                >
                  <SelectTrigger
                    className={cn("mt-1.5 w-full", stockMovementInputClass)}
                  >
                    {formatMovementLabel(selectedMovementType)}
                  </SelectTrigger>
                  <SelectContent>
                    {movementTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatMovementLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hiddenFields?.includes("stockBatch") ? (
              <div></div>
            ) : (
              <>
                {requiresStock ? (
                  <div>
                    <Label className="font-ochre-ui text-sm">Stock Batch</Label>
                    <Select
                      value={selectedStockId ?? ""}
                      onValueChange={(value) =>
                        form.setValue("stockId", value || undefined, {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger
                        className={cn("mt-1.5 w-full", stockMovementInputClass)}
                      >
                        <span className="block truncate text-left">
                          {selectedStock
                            ? `${selectedStock.item.name} - ${selectedStock.location?.name ?? "No location"} - ${selectedStock.type} (${selectedStock.quantity ?? 0}) - (${selectedStock.expiredAt?.toString().split("T")[0] ?? "Can't be expired"})`
                            : "Select source stock"}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {stockOptions.map((stock) => (
                          <SelectItem key={stock.id} value={stock.id}>
                            {stock.item.name} -{" "}
                            {stock.location?.name ?? "No location"} -{" "}
                            {stock.type} ({stock.quantity ?? 0}) - (
                            {stock.expiredAt?.toString().split("T")[0] ??
                              "Can't be expired"}
                            )
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.stockId ? (
                      <p className="mt-1 font-ochre-ui text-xs text-red-600">
                        {form.formState.errors.stockId.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}

            <div className="grid gap-4  ">
              {requiresDestination ? (
                <div>
                  <Label className="font-ochre-ui text-sm">
                    {form.getValues("stockMovementType") === "RECEIVE"}
                    Destination location
                  </Label>
                  <Select
                    value={form.watch("destinationLocationId") ?? ""}
                    onValueChange={(value) =>
                      form.setValue(
                        "destinationLocationId",
                        value || undefined,
                        {
                          shouldValidate: true,
                        },
                      )
                    }
                  >
                    <SelectTrigger
                      className={cn("mt-1.5 w-full", stockMovementInputClass)}
                    >
                      {form.watch("destinationLocationId")
                        ? (locations.find(
                            (location) =>
                              location.id ===
                              form.watch("destinationLocationId"),
                          )?.name ?? "Select destination")
                        : "Select destination"}
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.destinationLocationId ? (
                    <p className="mt-1 font-ochre-ui text-xs text-red-600">
                      {form.formState.errors.destinationLocationId.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </fieldset>

          <fieldset className="mt-6 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="font-ochre-ui text-sm font-semibold text-[#121c28]">
                Expiration date (Optional)
              </Label>

              <div className="inline-flex rounded-lg bg-[#eef4ff] p-0.5 border border-[#d9e3f4]/40">
                <button
                  type="button"
                  onClick={() => setExpiryInputMode("picker")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer",
                    expiryInputMode === "picker"
                      ? "bg-white text-[#894d0d] shadow-[0_2px_8px_rgba(137,77,13,0.12)] font-bold"
                      : "text-[#565e74] hover:text-[#121c28]",
                  )}
                >
                  <Calendar className="size-3.5 text-[#894d0d]" />
                  Calendar
                </button>
                <button
                  type="button"
                  onClick={() => setExpiryInputMode("manual")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer",
                    expiryInputMode === "manual"
                      ? "bg-white text-[#894d0d] shadow-[0_2px_8px_rgba(137,77,13,0.12)] font-bold"
                      : "text-[#565e74] hover:text-[#121c28]",
                  )}
                >
                  <Keyboard className="size-3.5 text-[#894d0d]" />
                  Manual
                </button>
              </div>
            </div>

            <div className="relative">
              <Input
                type={expiryInputMode === "picker" ? "date" : "text"}
                placeholder={
                  expiryInputMode === "picker" ? undefined : "YYYY-MM-DD"
                }
                className={cn("w-full", datePickerInputClass)}
                {...form.register("expiredAt", {
                  setValueAs: (value) => (value === "" ? undefined : value),
                })}
              />
              {form.formState.errors.expiredAt ? (
                <p className="mt-1 font-ochre-ui text-xs text-red-600">
                  {form.formState.errors.expiredAt.message}
                </p>
              ) : null}
            </div>
            <p className="mt-1.5 font-ochre-ui text-xs text-[#524439]/70 leading-normal">
              {expiryInputMode === "picker"
                ? "Select the date when this stock batch will expire using the calendar picker."
                : "Type the date in YYYY-MM-DD format (e.g., 2026-12-31)."}
            </p>
          </fieldset>

          <fieldset className="mt-6 space-y-4">
            <legend className="font-ochre-ui text-[11px] font-semibold uppercase tracking-wider text-[#524439]">
              Quantity and audit note
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="font-ochre-ui text-sm">Quantity</Label>
                <Controller
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <Input
                      type="text"
                      inputMode="numeric"
                      className={cn("mt-1.5", stockMovementInputClass)}
                      placeholder="1.000"
                      value={formatThousand(field.value ?? "")}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const numericValue = unformatThousand(rawValue);
                        // Directly updates the numerical form state without DOM interference
                        field.onChange(
                          numericValue === 0 ? undefined : numericValue,
                        );
                      }}
                    />
                  )}
                />
                {form.formState.errors.quantity ? (
                  <p className="mt-1 font-ochre-ui text-xs text-red-600">
                    {form.formState.errors.quantity.message}
                  </p>
                ) : null}
              </div>

              {form.getValues("stockMovementType") === "TRANSFER" ? (
                <div></div>
              ) : (
                <div>
                  <Label className="font-ochre-ui text-sm">
                    Total cost {requiresTotalCost ? "" : "(optional)"}
                  </Label>
                  <Controller
                    control={form.control}
                    name="totalCost"
                    render={({ field }) => (
                      <Input
                        type="text"
                        inputMode="numeric"
                        className={cn("mt-1.5", stockMovementInputClass)}
                        placeholder="10.000.000"
                        value={formatThousand(field.value ?? "")}
                        onChange={(e) => {
                          const rawValue = e.target.value;
                          const numericValue = unformatThousand(rawValue);
                          field.onChange(
                            numericValue === 0 ? undefined : numericValue,
                          );
                        }}
                      />
                    )}
                  />
                  {form.formState.errors.totalCost ? (
                    <p className="mt-1 font-ochre-ui text-xs text-red-600">
                      {form.formState.errors.totalCost.message}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <div>
              <Label className="font-ochre-ui text-sm">Reason</Label>
              <Textarea
                rows={4}
                placeholder="Describe why this stock movement is being recorded."
                className={cn("mt-1.5", stockMovementInputClass)}
                {...form.register("reason")}
              />
              {form.formState.errors.reason ? (
                <p className="mt-1 font-ochre-ui text-xs text-red-600">
                  {form.formState.errors.reason.message}
                </p>
              ) : null}
            </div>
          </fieldset>
        </form>

        <DialogFooter className="mb-1 shrink-0 gap-2 border-t border-[#eef4ff] bg-[#f8f9ff]/50 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded border-[#121c28]/30 font-ochre-ui text-[#121c28] hover:bg-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={createMutation.isPending}
            className="rounded bg-[#894d0d] font-ochre-ui text-white hover:bg-[#6d3a00]"
          >
            {createMutation.isPending ? "Saving..." : "Create movement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
