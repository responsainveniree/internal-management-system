"use client";

import { StockSortBy } from "@/features/stocks/stock.types";
import { ArrowUpDown } from "lucide-react";

type TableHeaderProps = {
  showItemName: boolean;
  sortBy: StockSortBy;
  sortOrder: "asc" | "desc";
  onRequestSort: (column: StockSortBy) => void;
};

export default function TableHeader({
  showItemName,
  onRequestSort,
}: TableHeaderProps) {
  return (
    <thead className="border-b border-[#d9e3f4] bg-[#eef4ff]/70 text-left font-ochre-ui text-xs font-semibold uppercase tracking-wider text-[#524439]">
      <tr>
        {showItemName && (
          <th scope="col" className="px-4 py-3.5 align-middle">
            Item
          </th>
        )}

        <th scope="col" className="px-4 py-3.5 align-middle">
          Location
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          <button
            type="button"
            onClick={() => onRequestSort("stockType")}
            className="inline-flex items-center gap-1 hover:text-[#894d0d] focus:outline-none"
          >
            Type
            <ArrowUpDown className="size-3.5" />
          </button>
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          <button
            type="button"
            onClick={() => onRequestSort("quantity")}
            className="inline-flex items-center gap-1 hover:text-[#894d0d] focus:outline-none"
          >
            Quantity
            <ArrowUpDown className="size-3.5" />
          </button>
        </th>
        <th
          scope="col"
          className="hidden px-4 py-3.5 align-middle md:table-cell"
        >
          <button
            type="button"
            onClick={() => onRequestSort("expiredAt")}
            className="inline-flex items-center gap-1 hover:text-[#894d0d] focus:outline-none"
          >
            Expires
            <ArrowUpDown className="size-3.5" />
          </button>
        </th>
        <th
          scope="col"
          className="hidden px-4 py-3.5 align-middle lg:table-cell"
        >
          <button
            type="button"
            onClick={() => onRequestSort("updatedAt")}
            className="inline-flex items-center gap-1 hover:text-[#894d0d] focus:outline-none"
          >
            Updated
            <ArrowUpDown className="size-3.5" />
          </button>
        </th>
        <th scope="col" className="px-4 py-3.5 text-right align-middle">
          Actions
        </th>
      </tr>
    </thead>
  );
}
