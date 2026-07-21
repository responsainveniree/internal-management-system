/*
  Warnings:

  - Added the required column `itemName` to the `StockMovement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "itemName" TEXT NOT NULL;
