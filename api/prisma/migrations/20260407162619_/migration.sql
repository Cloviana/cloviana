/*
  Warnings:

  - You are about to drop the `Business` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Business" DROP CONSTRAINT "Business_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."business_invites" DROP CONSTRAINT "business_invites_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."business_members" DROP CONSTRAINT "business_members_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."competitors" DROP CONSTRAINT "competitors_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."jobs" DROP CONSTRAINT "jobs_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."subscriptions" DROP CONSTRAINT "subscriptions_businessId_fkey";

-- DropTable
DROP TABLE "public"."Business";

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "stripeCustomerId" TEXT,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "description" TEXT,
    "icp" TEXT,
    "setupStatus" "BusinessSetupStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "setupStep" "BusinessSetupStep" NOT NULL DEFAULT 'DOMAIN',
    "setupCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "businesses_ownerId_idx" ON "businesses"("ownerId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invites" ADD CONSTRAINT "business_invites_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
