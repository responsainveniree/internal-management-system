import { MovementType } from "@prisma/client";
import prisma from "../prisma";
import type { SeedEntityMap } from "./types";

export async function createOrdersSeed(
  frontDeskUser: { id: string },
  items: SeedEntityMap,
  frontOffice: { id: string },
) {
  await prisma.stockMovement.deleteMany({ where: { orderId: { not: null } } });
  await prisma.order.deleteMany();
  const ordersData = [
    {
      roomNumber: "101",
      guestName: "John Smith",
      isBilledToRoom: true,
      createdBy: frontDeskUser.id,
      items: [
        { itemName: "Mineral Water 600ml", quantity: 2, priceAtSale: 3.5 },
        { itemName: "Coffee Sachet", quantity: 3, priceAtSale: 2.0 },
      ],
    },
    {
      roomNumber: "205",
      guestName: "Maria Santos",
      isBilledToRoom: true,
      createdBy: frontDeskUser.id,
      items: [
        { itemName: "Mineral Water 600ml", quantity: 4, priceAtSale: 3.5 },
        { itemName: "Tea Bag", quantity: 2, priceAtSale: 1.5 },
      ],
    },
    {
      roomNumber: "312",
      guestName: "David Lee",
      isBilledToRoom: false,
      createdBy: frontDeskUser.id,
      items: [
        { itemName: "Coffee Sachet", quantity: 5, priceAtSale: 2.0 },
        { itemName: "Mineral Water 600ml", quantity: 3, priceAtSale: 3.5 },
        { itemName: "Tea Bag", quantity: 4, priceAtSale: 1.5 },
      ],
    },
  ];

  let orderCount = 0;

  for (const orderData of ordersData) {
    const totalAmount = orderData.items.reduce(
      (sum, oi) => sum + oi.quantity * oi.priceAtSale,
      0,
    );

    const order = await prisma.order.create({
      data: {
        roomNumber: orderData.roomNumber,
        guestName: orderData.guestName,
        isBilledToRoom: orderData.isBilledToRoom,
        totalAmount,
        createdBy: orderData.createdBy,
        items: {
          create: orderData.items.map((oi) => ({
            itemId: items[oi.itemName].id,
            quantity: oi.quantity,
            priceAtSale: oi.priceAtSale,
          })),
        },
      },
    });

    // Create corresponding SALE stock movements
    for (const oi of orderData.items) {
      await prisma.stockMovement.create({
        data: {
          itemId: items[oi.itemName].id,
          itemName: items[oi.itemName].name,
          type: MovementType.SALE,
          quantity: oi.quantity,
          totalCost: oi.quantity * oi.priceAtSale,
          sourceLocationId: frontOffice.id,
          orderId: order.id,
          reason: `Sale — Room ${orderData.roomNumber} (${orderData.guestName})`,
          createdBy: orderData.createdBy,
        },
      });
    }

    orderCount++;
  }

  return { orderCount, ordersData };
}
