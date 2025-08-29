/*
  Warnings:

  - The values [SETTING_UP,SETUP_FAILED] on the enum `StoreStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscriptions` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StoreStatus_new" AS ENUM ('DRAFT', 'ACTIVE', 'LOCKED', 'INITIALIZING');
ALTER TABLE "stores" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "stores" ALTER COLUMN "status" TYPE "StoreStatus_new" USING ("status"::text::"StoreStatus_new");
ALTER TYPE "StoreStatus" RENAME TO "StoreStatus_old";
ALTER TYPE "StoreStatus_new" RENAME TO "StoreStatus";
DROP TYPE "StoreStatus_old";
ALTER TABLE "stores" ALTER COLUMN "status" SET DEFAULT 'LOCKED';
COMMIT;

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_planId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_storeId_fkey";

-- AlterTable
ALTER TABLE "stores" ALTER COLUMN "status" SET DEFAULT 'LOCKED';

-- DropTable
DROP TABLE "plans";

-- DropTable
DROP TABLE "subscriptions";

-- DropEnum
DROP TYPE "PlanInterval";

-- DropEnum
DROP TYPE "PlanName";

-- DropEnum
DROP TYPE "SubscriptionStatus";

UPDATE "stores" s
SET "status" = 'LOCKED'
WHERE s."status" = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1 FROM "channels" c WHERE c."storeId" = s."id"
  );
