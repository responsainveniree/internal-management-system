"use client";

import { ItemGetManySchema } from "@/shared/lib/zods/item.zod";
import { ArrowUpDown } from "lucide-react";

type SortBy = ItemGetManySchema["sortBy"];

type TableHeaderProps = {
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  onRequestSort: (column: SortBy) => void;
};

export default function TableHeader({ onRequestSort }: TableHeaderProps) {
  return (
    <thead className="border-b border-[#d9e3f4] bg-[#eef4ff]/70 text-left font-ochre-ui text-xs font-semibold uppercase tracking-wider text-[#524439]">
      <tr>
        <th scope="col" className="px-4 py-3.5 align-middle">
          <button
            type="button"
            onClick={() => onRequestSort("name")}
            className="inline-flex items-center gap-1 hover:text-[#894d0d] focus:outline-none"
          >
            Item Details
            <ArrowUpDown className="size-3.5" />
          </button>
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          Status
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          Category
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          Selling Price
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          Cost Price
        </th>
        <th
          scope="col"
          className="hidden px-4 py-3.5 align-middle lg:table-cell"
        >
          <button
            type="button"
            onClick={() => onRequestSort("createdAt")}
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
