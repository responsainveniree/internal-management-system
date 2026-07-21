export const stockMovementInputClass =
  "rounded-lg border-[#e5eeff] bg-[#f8f9ff]/80 font-ochre-ui text-sm text-[#121c28] focus-visible:border-[#894d0d]/35 focus-visible:ring-2 focus-visible:ring-[#894d0d]/15";

export const stockMovementPanelClass =
  "rounded-xl border border-[#d9e3f4]/80 bg-white shadow-[0_16px_48px_-20px_rgba(15,23,42,0.08)]";

export const datePickerInputClass =
  "rounded border-[#d9e3f4] bg-white font-ochre-ui text-sm focus-visible:border-[#894d0d]/50 focus-visible:ring-[#894d0d]/25";

export const movementTone: Record<string, string> = {
  RECEIVE: "border-emerald-500/40 bg-emerald-50 text-emerald-800",
  TRANSFER: "border-sky-500/40 bg-sky-50 text-sky-800",
  CONSUME: "border-amber-500/40 bg-amber-50 text-amber-800",
  SALE: "border-violet-500/40 bg-violet-50 text-violet-800",
  DISCARD: "border-rose-500/40 bg-rose-50 text-rose-800",
  LAUNDRY_OUT: "border-indigo-500/40 bg-indigo-50 text-indigo-800",
  LAUNDRY_IN: "border-cyan-500/40 bg-cyan-50 text-cyan-800",
  ADJUSTMENT: "border-[#894d0d]/40 bg-[#894d0d]/10 text-[#894d0d]",
  MARK_AS_DAMAGED: "border-red-500/40 bg-red-50 text-red-800",
  MARK_AS_DIRTY: "border-stone-500/40 bg-stone-50 text-stone-800",
  MARK_AS_LOST: "border-zinc-500/40 bg-zinc-50 text-zinc-800",
  MARK_AS_EXPIRED: "border-orange-500/40 bg-orange-50 text-orange-800",
};
