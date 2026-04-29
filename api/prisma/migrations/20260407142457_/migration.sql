/*
  Warnings:

  - You are about to drop the column `storeId` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the `stores` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[type,businessId,dedupeKey]` on the table `jobs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessId` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."business_invites" DROP CONSTRAINT "business_invites_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."business_members" DROP CONSTRAINT "business_members_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."jobs" DROP CONSTRAINT "jobs_storeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."stores" DROP CONSTRAINT "stores_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."subscriptions" DROP CONSTRAINT "subscriptions_storeId_fkey";

-- DropIndex
DROP INDEX "public"."jobs_storeId_type_status_idx";

-- DropIndex
DROP INDEX "public"."jobs_type_storeId_dedupeKey_key";

-- DropIndex
DROP INDEX "public"."subscriptions_storeId_key";

-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "storeId",
ADD COLUMN     "businessId" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "storeId",
ADD COLUMN     "businessId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."stores";

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "stripeCustomerId" TEXT,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "primaryLanguage" TEXT,
    "setupStatus" "BusinessSetupStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "setupStep" "BusinessSetupStep" NOT NULL DEFAULT 'DOMAIN',
    "setupCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");

-- CreateIndex
CREATE INDEX "competitors_businessId_idx" ON "competitors"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "competitors_businessId_domain_key" ON "competitors"("businessId", "domain");

-- CreateIndex
CREATE INDEX "jobs_businessId_type_status_idx" ON "jobs"("businessId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_type_businessId_dedupeKey_key" ON "jobs"("type", "businessId", "dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_businessId_key" ON "subscriptions"("businessId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invites" ADD CONSTRAINT "business_invites_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
