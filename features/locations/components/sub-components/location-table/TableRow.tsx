"use client";

import { Info, Pencil, Trash2 } from "lucide-react";
import type { LocationListItem } from "@/features/locations/location.types";
import { formatLocationTypeBadge } from "@/features/locations/location.utils";
import { cn } from "@/shared/lib/utils";
import { useSession } from "next-auth/react";
import { canDeleteLocation } from "@/shared/lib/validations/user-access-validation";

type TableRowProps = {
  location: LocationListItem;
  index: number;
  onInfo: (location: LocationListItem) => void;
  onEdit: (location: LocationListItem) => void;
  onDelete: (location: LocationListItem) => void;
};

export default function TableRow({
  location,
  index,
  onInfo,
  onEdit,
  onDelete,
}: TableRowProps) {
  const { data } = useSession();
  const isEven = index % 2 === 0;

  return (
    <tr
      className={cn(
        "border-b border-[#eef4ff] transition-colors duration-150",
        isEven ? "bg-[#f8f9ff]/50" : "bg-white",
        "hover:bg-[#f5f8ff]",
      )}
    >
      <td className="px-4 py-3.5 align-middle">
        <div className="min-w-0">
          <p className="truncate font-ochre-ui text-sm font-semibold text-[#121c28]">
            {location.name}
          </p>
        </div>
      </td>
      <td className="px-4 py-3.5 align-middle text-left">
        <span className="inline-flex items-center rounded-md bg-[#121c28] px-2.5 py-1 font-ochre-ui text-[10px] font-semibold uppercase tracking-wide text-white">
          {formatLocationTypeBadge(location.type)}
        </span>
      </td>
      <td className="hidden max-w-xs px-4 py-3.5 align-middle md:table-cell">
        <p className="truncate font-ochre-ui text-xs text-[#524439]">
          {location.description?.trim() || "—"}
        </p>
      </td>
      <td className="hidden px-4 py-3.5 align-middle font-ochre-ui text-xs text-[#524439] lg:table-cell">
        {new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(new Date(location.createdAt))}
      </td>
      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
        <div className="inline-flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onInfo(location)}
            className="inline-flex size-7 items-center justify-center rounded-md border border-[#e5eeff] bg-[#eef4ff] text-[#894d0d] transition-all hover:bg-[#894d0d] hover:text-white shadow-xs focus-visible:outline-2 focus-visible:outline-[#894d0d]"
            title="View Details"
            aria-label={`View details for ${location.name}`}
          >
            <Info className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(location)}
            className="inline-flex size-7 items-center justify-center rounded-md border border-[#e5eeff] bg-white text-[#565e74] transition-all hover:bg-[#e5eeff] hover:text-[#121c28] shadow-xs focus-visible:outline-2 focus-visible:outline-[#894d0d]"
            title="Edit Location"
            aria-label={`Edit ${location.name}`}
          >
            <Pencil className="size-4" strokeWidth={1.5} />
          </button>
          {data?.user.role && canDeleteLocation(data?.user.role) && (
            <button
              type="button"
              onClick={() => onDelete(location)}
              className="inline-flex size-7 items-center justify-center rounded-md border border-[#ffdad6] bg-rose-50 text-[#ba1a1a] transition-all hover:bg-[#ffdad6] shadow-xs focus-visible:outline-2 focus-visible:outline-[#ba1a1a]"
              title="Delete Location"
              aria-label={`Delete ${location.name}`}
            >
              <Trash2 className="size-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
