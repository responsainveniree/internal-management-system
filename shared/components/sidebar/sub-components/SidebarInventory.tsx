"use client";

import { Package, ChevronDown } from "lucide-react";
import { cn, isInventoryChildActive } from "@/shared/lib/utils";
import InventorySubLink from "./InventorySubLink";
import CollapsedFlyoutLink from "./ColapsedFlyoutLink";
import { navAmbient } from "../sidebar-link.styles";
import { AnimatePresence, motion } from "framer-motion";
import { PathsType } from "@/shared/lib/constants/url-paths";
import {
  canManageCategory,
  canManageItem,
  canManageLaundry,
  canManageLocation,
  canManageStock,
  canManageStockMovement,
  canUpdateReviewGetDeleteStockRequest,
} from "@/shared/lib/validations/user-access-validation";
import { useSession } from "next-auth/react";

interface SidebarInventoryProps {
  isExpanded: boolean;
  pathname: string;
  paths: PathsType;
  inventoryOpen: boolean;
  setInventoryOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  inventoryFlyoutOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  inventoryFlyoutId: string;
}

export default function SidebarInventory({
  isExpanded,
  pathname,
  paths,
  inventoryOpen,
  setInventoryOpen,
  inventoryFlyoutOpen,
  onMouseEnter,
  onMouseLeave,
  onKeyDown,
  inventoryFlyoutId,
}: SidebarInventoryProps) {
  const { data } = useSession();

  const inventoryChildActive = isInventoryChildActive(pathname, paths);
  if (isExpanded) {
    return (
      <div className="mt-1">
        <button
          type="button"
          onClick={() => setInventoryOpen((o) => !o)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[#eaf1ff]/90 outline-none",
            navAmbient,
            (inventoryOpen || inventoryChildActive) &&
              "bg-[#0f172a]/20 text-[#eaf1ff]",
          )}
          aria-expanded={inventoryOpen}
        >
          <Package className="size-5.5 shrink-0 opacity-90" strokeWidth={1.5} />
          <span className="min-w-0 flex-1">Inventory</span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 opacity-70 transition-transform duration-300",
              inventoryOpen && "rotate-180",
            )}
            strokeWidth={1.75}
          />
        </button>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
            inventoryOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="relative ms-3 mt-1 border-s border-[#eaf1ff]/12 ps-3">
              <div className="space-y-1 pb-1 pt-0.5">
                {data?.user.role && canManageLocation(data?.user.role) && (
                  <InventorySubLink
                    href={paths.locations}
                    label="Locations"
                    active={pathname === paths.locations}
                  />
                )}
                {data?.user.role && canManageCategory(data?.user.role) && (
                  <InventorySubLink
                    href={paths.categories}
                    label="Categories"
                    active={pathname === paths.categories}
                  />
                )}
                {data?.user.role && canManageItem(data?.user.role) && (
                  <InventorySubLink
                    href={paths.items}
                    label="Items"
                    active={pathname === paths.items}
                  />
                )}
                {data?.user.role && canManageStock(data?.user.role) && (
                  <InventorySubLink
                    href={paths.stocks}
                    label="Stocks"
                    active={pathname === paths.stocks}
                  />
                )}
                {data?.user.role && canManageStockMovement(data?.user.role) && (
                  <InventorySubLink
                    href={paths.stock_movements}
                    label="Stock Movements"
                    active={pathname === paths.stock_movements}
                  />
                )}
                {data?.user.role && canManageLaundry(data?.user.role) && (
                  <InventorySubLink
                    href={paths.laundry}
                    label="Laundry"
                    active={pathname === paths.laundry}
                  />
                )}
                {data?.user.role &&
                  canUpdateReviewGetDeleteStockRequest(data?.user.role) && (
                    <InventorySubLink
                      href={paths.stock_requests}
                      label="Stock Requests"
                      active={pathname === paths.stock_requests}
                    />
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative mt-1 shrink-0"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-center rounded-lg py-2.5 text-[#eaf1ff]/90 outline-none",
          navAmbient,
          inventoryChildActive &&
            "bg-[#894d0d]/25 text-[#eaf1ff] shadow-[inset_0_0_0_1px_rgba(137,77,13,0.35)]",
          inventoryFlyoutOpen && "bg-[#0f172a]/25",
        )}
        onKeyDown={onKeyDown}
        title="Inventory"
      >
        <Package className="size-5.5 shrink-0 opacity-90" strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {inventoryFlyoutOpen && (
          <motion.div
            initial={{ opacity: 0, x: "-8px", scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: "-8px", scale: 0.97 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 260,
              mass: 0.8,
            }}
            id={inventoryFlyoutId}
            className="absolute inset-s-full top-0 z-auto ms-2 w-44 rounded-[10px] border border-white/[0.07] bg-[#1e2733] p-2 shadow-2xl"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <p className="px-2.5 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-[#eaf1ff]/35">
              Inventory
            </p>

            <div className="flex flex-col gap-0.5">
              {data?.user.role && canManageLocation(data?.user.role) && (
                <CollapsedFlyoutLink
                  href={paths.locations}
                  label="Locations"
                  active={pathname === paths.locations}
                />
              )}
              {data?.user.role && canManageCategory(data?.user.role) && (
                <CollapsedFlyoutLink
                  href={paths.categories}
                  label="Categories"
                  active={pathname === paths.categories}
                />
              )}
              {data?.user.role && canManageItem(data?.user.role) && (
                <CollapsedFlyoutLink
                  href={paths.items}
                  label="Items"
                  active={pathname === paths.items}
                />
              )}
              {data?.user.role && canManageStock(data?.user.role) && (
                <CollapsedFlyoutLink
                  href={paths.stocks}
                  label="Stocks"
                  active={pathname === paths.stocks}
                />
              )}
              {data?.user.role && canManageStockMovement(data?.user.role) && (
                <CollapsedFlyoutLink
                  href={paths.stock_movements}
                  label="Stock Movements"
                  active={pathname === paths.stock_movements}
                />
              )}
              {data?.user.role && canManageLaundry(data?.user.role) && (
                <CollapsedFlyoutLink
                  href={paths.laundry}
                  label="Laundry"
                  active={pathname === paths.laundry}
                />
              )}
              {data?.user.role &&
                canUpdateReviewGetDeleteStockRequest(data?.user.role) && (
                  <CollapsedFlyoutLink
                    href={paths.stock_requests}
                    label="Stock Requests"
                    active={pathname === paths.stock_requests}
                  />
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
