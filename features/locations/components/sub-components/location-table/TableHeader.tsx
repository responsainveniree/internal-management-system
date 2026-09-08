"use client";

import { LocationGetManySchema } from "@/shared/lib/zods/location.zod";
import { ArrowUpDown } from "lucide-react";

type TableHeaderProps = {
  sortBy: LocationGetManySchema["sortBy"];
  sortOrder: "asc" | "desc";
  onRequestSort: (column: LocationGetManySchema["sortBy"]) => void;
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
            Name
            <ArrowUpDown className="size-3.5" />
          </button>
        </th>
        <th scope="col" className="px-4 py-3.5 align-middle">
          <button
            type="button"
            onClick={() => onRequestSort("type")}
            className="inline-flex items-center gap-1 hover:text-[#894d0d] focus:outline-none"
          >
            Type
            <ArrowUpDown className="size-3.5" />
          </button>
        </th>
        <th
          scope="col"
          className="hidden px-4 py-3.5 align-middle md:table-cell"
        >
          Description
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
            Created
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
