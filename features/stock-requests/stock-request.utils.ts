import { StockRequestStatus, StockRequestType } from "@prisma/client";

export function formatStockRequestType(type: string): string {
  switch (type) {
    case "ISSUE":
      return "Issue";
    case "RESTOCK":
      return "Restock";
    case "TRANSFER":
      return "Transfer";
    case "SALE":
      return "Sale";
    case "REPORT_LOST":
      return "Report Lost";
    case "WRITE_OFF":
      return "Write-Off";
    case "LAUNDRY_IN":
      return "Laundry In";
    case "LAUNDRY_OUT":
      return "Laundry Out";
    default:
      return type
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");
  }
}

export function getStockRequestStatusBadge(
  status: StockRequestStatus | string,
) {
  switch (status) {
    case "PENDING":
      return {
        label: "PENDING",
        className:
          "bg-amber-50 text-amber-800 border-amber-200/80 font-semibold",
      };
    case "APPROVED":
      return {
        label: "APPROVED",
        className:
          "bg-emerald-50 text-emerald-800 border-emerald-200/80 font-semibold",
      };
    case "REJECTED":
      return {
        label: "REJECTED",
        className: "bg-rose-50 text-rose-800 border-rose-200/80 font-semibold",
      };
    default:
      return {
        label: status,
        className:
          "bg-slate-50 text-slate-700 border-slate-200/80 font-semibold",
      };
  }
}

export function getStockRequestTypeBadge(type: StockRequestType | string) {
  switch (type) {
    case "ISSUE":
      return {
        label: "Issue",
        className: "bg-sky-50 text-sky-800 border-sky-200/80 font-semibold",
      };
    case "RESTOCK":
      return {
        label: "Restock",
        className:
          "bg-indigo-50 text-indigo-800 border-indigo-200/80 font-semibold",
      };
    case "TRANSFER":
      return {
        label: "Transfer",
        className:
          "bg-purple-50 text-purple-800 border-purple-200/80 font-semibold",
      };
    case "SALE":
      return {
        label: "Sale",
        className: "bg-teal-50 text-teal-800 border-teal-200/80 font-semibold",
      };
    case "REPORT_LOST":
      return {
        label: "Report Lost",
        className:
          "bg-orange-50 text-orange-800 border-orange-200/80 font-semibold",
      };
    case "WRITE_OFF":
      return {
        label: "Write-Off",
        className: "bg-zinc-100 text-zinc-800 border-zinc-300 font-semibold",
      };
    case "LAUNDRY_IN":
      return {
        label: "Laundry In",
        className: "bg-cyan-50 text-cyan-800 border-cyan-200/80 font-semibold",
      };
    case "LAUNDRY_OUT":
      return {
        label: "Laundry Out",
        className: "bg-blue-50 text-blue-800 border-blue-200/80 font-semibold",
      };
    default:
      return {
        label: formatStockRequestType(type),
        className:
          "bg-slate-50 text-slate-700 border-slate-200/80 font-semibold",
      };
  }
}
