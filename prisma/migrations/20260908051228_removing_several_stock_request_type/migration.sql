/*
  Warnings:

  - The values [FULFILLED,CANCELLED] on the enum `StockRequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StockRequestStatus_new" AS ENUM ('PENDING', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED');
ALTER TABLE "public"."StockRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "StockRequest" ALTER COLUMN "status" TYPE "StockRequestStatus_new" USING ("status"::text::"StockRequestStatus_new");
ALTER TYPE "StockRequestStatus" RENAME TO "StockRequestStatus_old";
ALTER TYPE "StockRequestStatus_new" RENAME TO "StockRequestStatus";
DROP TYPE "public"."StockRequestStatus_old";
ALTER TABLE "StockRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
