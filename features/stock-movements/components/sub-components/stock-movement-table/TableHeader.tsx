"use client";

import { ArrowUpDown } from "lucide-react";
import type { StockMovementGetManySchema } from "@/shared/lib/zods/stock-movements.zod";

type SortBy = StockMovementGetManySchema["sortBy"];

type TableHeaderProps = {
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  onRequestSort: (column: SortBy) => void;
};

const columns: { label: string; value: SortBy; className?: string }[] = [
  { label: "Movement", value: "name" },
  { label: "Type", value: "type" },
  { label: "Source", value: "sourceLocation" },
  { label: "Destination", value: "destinationLocation" },
  { label: "Created", value: "createdAt", className: "hidden md:table-cell" },
];

export default function TableHeader({ onRequestSort }: TableHeaderProps) {
  return (
    <thead className="border-b border-[#d9e3f4] bg-[#eef4ff]/70 text-left font-ochre-ui text-xs font-semibold uppercase tracking-wider text-[#524439]">
      <tr>
        {columns.map((column) => (
          <th
            key={column.value}
            scope="col"
            className={`px-4 py-3.5 align-middle ${column.className ?? ""}`}
          >
            <button
              type="button"
              onClick={() => onRequestSort(column.value)}
              className="inline-flex items-center gap-1 hover:text-[#894d0d] focus:outline-none"
            >
              {column.label}
              <ArrowUpDown className="size-3.5" />
            </button>
          </th>
        ))}
        <th scope="col" className="px-4 py-3.5 text-right align-middle">
          Actions
        </th>
      </tr>
    </thead>
  );
}
