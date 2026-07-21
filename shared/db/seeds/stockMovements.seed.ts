import { MovementType } from "@prisma/client";
import prisma from "../prisma";
import type { SeedEntityMap } from "./types";

export async function createStockMovementsSeed(
  locations: SeedEntityMap,
  items: SeedEntityMap,
  supervisorUser: { id: string },
  housekeepingUser: { id: string },
  accountantUser: { id: string },
) {
  await prisma.stockMovement.deleteMany();

  const frontOffice = locations["Front Office"];

  const movementsData = [
    // Receive into Main Warehouse
    {
      itemName: "Bath Towel",
      type: MovementType.RECEIVE,
      quantity: 150,
      destinationLocationName: "Main Warehouse",
      sourceLocationName: null,
      reason: "Initial stock intake from supplier",
      createdBy: supervisorUser.id,
    },
    {
      itemName: "Shampoo Sachet 30ml",
      type: MovementType.RECEIVE,
      quantity: 500,
      destinationLocationName: "Main Warehouse",
      sourceLocationName: null,
      reason: "Monthly toiletries restock",
      createdBy: supervisorUser.id,
    },
    // Transfer from Warehouse to Floor Locker
    {
      itemName: "Bath Towel",
      type: MovementType.TRANSFER,
      quantity: 40,
      sourceLocationName: "Main Warehouse",
      destinationLocationName: "Floor 1 Locker",
      reason: "Restocking floor 1–3 housekeeping locker",
      createdBy: housekeepingUser.id,
    },
    {
      itemName: "Shampoo Sachet 30ml",
      type: MovementType.TRANSFER,
      quantity: 100,
      sourceLocationName: "Main Warehouse",
      destinationLocationName: "Floor 1 Locker",
      reason: "Weekly floor locker replenishment",
      createdBy: housekeepingUser.id,
    },
    // Consume during operations
    {
      itemName: "Bath Soap 40g",
      type: MovementType.CONSUME,
      quantity: 30,
      sourceLocationName: "Floor 1 Locker",
      destinationLocationName: null,
      reason: "Daily room preparation — floors 1–3",
      createdBy: housekeepingUser.id,
    },
    {
      itemName: "Coffee Sachet",
      type: MovementType.CONSUME,
      quantity: 50,
      sourceLocationName: "Operational Store",
      destinationLocationName: null,
      reason: "Guest room coffee replenishment",
      createdBy: housekeepingUser.id,
    },
    // Laundry out
    {
      itemName: "Bath Towel",
      type: MovementType.LAUNDRY_OUT,
      quantity: 18,
      sourceLocationName: "Main Warehouse",
      destinationLocationName: null,
      reason: "Dirty towels sent to laundry service",
      createdBy: housekeepingUser.id,
    },
    {
      itemName: "King Bed Sheet Set",
      type: MovementType.LAUNDRY_OUT,
      quantity: 10,
      sourceLocationName: "Main Warehouse",
      destinationLocationName: null,
      reason: "Weekly linen laundry batch",
      createdBy: supervisorUser.id,
    },
    // Laundry in (returned clean)
    {
      itemName: "Bath Towel",
      type: MovementType.LAUNDRY_IN,
      quantity: 15,
      sourceLocationName: null,
      destinationLocationName: "Main Warehouse",
      reason: "Clean towels returned from laundry",
      createdBy: housekeepingUser.id,
    },
    // Discard damaged/expired
    {
      itemName: "Shampoo Sachet 30ml",
      type: MovementType.DISCARD,
      quantity: 20,
      sourceLocationName: "Main Warehouse",
      destinationLocationName: null,
      reason: "Expired stock disposal",
      createdBy: supervisorUser.id,
    },
    {
      itemName: "Bath Towel",
      type: MovementType.DISCARD,
      quantity: 5,
      sourceLocationName: "Main Warehouse",
      destinationLocationName: null,
      reason: "Damaged beyond repair — torn during guest use",
      createdBy: supervisorUser.id,
    },
    // Adjustment
    {
      itemName: "Ballpoint Pen",
      type: MovementType.ADJUSTMENT,
      quantity: 10,
      sourceLocationName: null,
      destinationLocationName: "Front Office",
      reason: "Inventory count correction after audit",
      createdBy: accountantUser.id,
    },
  ];

  let movementCount = 0;

  for (const mv of movementsData) {
    const item = items[mv.itemName];
    const srcLoc = mv.sourceLocationName
      ? locations[mv.sourceLocationName]
      : null;
    const dstLoc = mv.destinationLocationName
      ? locations[mv.destinationLocationName]
      : null;

    if (!item) {
      console.warn(`   ⚠ Skipping movement: item "${mv.itemName}" not found`);
      continue;
    }

    await prisma.stockMovement.create({
      data: {
        itemId: item.id,
        itemName: item.name,
        type: mv.type,
        quantity: mv.quantity,
        reason: mv.reason,
        sourceLocationId: srcLoc?.id ?? null,
        destinationLocationId: dstLoc?.id ?? null,
        createdBy: mv.createdBy,
      },
    });
    movementCount++;
  }

  return {
    movementCount,
    movementsData,
    frontOffice,
  };
}
