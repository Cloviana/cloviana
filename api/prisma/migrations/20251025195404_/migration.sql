-- CreateEnum
CREATE TYPE "AccessStage" AS ENUM ('WAITLISTED', 'INVITED', 'BETA', 'ACTIVE', 'REJECTED');

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "betaUntil" TIMESTAMP(3),
ADD COLUMN     "stage" "AccessStage" NOT NULL DEFAULT 'WAITLISTED';

-- CreateTable
CREATE TABLE "beta_invites" (
    "id" UUID NOT NULL,
    "storeId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beta_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "beta_invites_token_key" ON "beta_invites"("token");

-- CreateIndex
CREATE INDEX "beta_invites_storeId_invitedAt_idx" ON "beta_invites"("storeId", "invitedAt");

-- AddForeignKey
ALTER TABLE "beta_invites" ADD CONSTRAINT "beta_invites_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
