"use client";

import { StockRequestFilterSchema } from "@/shared/lib/zods/stock-request.zod";
import { ArrowUpDown } from "lucide-react";

type TableHeaderProps = {
  sortBy: StockRequestFilterSchema["sortBy"];
  sortOrder: StockRequestFilterSchema["sortOrder"];
  onRequestSort: (column: StockRequestFilterSchema["sortBy"]) => void;
};

export default function TableHeader({
  sortBy,
  sortOrder,
  onRequestSort,
}: TableHeaderProps) {
  return (
    <thead className="border-b border-[#d9e3f4] bg-[#eef4ff]/70 text-left font-ochre-ui text-xs font-semibold uppercase tracking-wider text-[#524439]">
      <tr>
        <th scope="col" className="px-4 py-3.5 align-middle">
          <button
            type="button"
            onClick={() => onRequestSort("itemName")}
            className="inline-flex items-center gap-1 hover:text-[#894d0d] focus:outline-none"
          >
            Item Name
            <ArrowUpDown className="size-3.5" />
          </button>
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          Type
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          Quantity
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          Status
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          <button
            type="button"
            onClick={() => onRequestSort("sourceLocation")}
            className="inline-flex items-center gap-1 hover:text-[#894d0d] focus:outline-none"
          >
            Source Location
            <ArrowUpDown className="size-3.5" />
          </button>
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          <button
            type="button"
            onClick={() => onRequestSort("destinationLocation")}
            className="inline-flex items-center gap-1 hover:text-[#894d0d] focus:outline-none"
          >
            Destination Location
            <ArrowUpDown className="size-3.5" />
          </button>
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          Requested By
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          <button
            type="button"
            onClick={() => onRequestSort("createdAt")}
            className="inline-flex items-center gap-1 hover:text-[#894d0d] focus:outline-none"
          >
            Date
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
