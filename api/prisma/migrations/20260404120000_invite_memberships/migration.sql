-- CreateEnum
CREATE TYPE "BusinessMembershipRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "BusinessInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "business_members" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "profileId" UUID NOT NULL,
    "role" "BusinessMembershipRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_invites" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "role" "BusinessMembershipRole" NOT NULL DEFAULT 'MEMBER',
    "status" "BusinessInviteStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" UUID NOT NULL,
    "acceptedById" UUID,
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_members_businessId_profileId_key" ON "business_members"("businessId", "profileId");

-- CreateIndex
CREATE INDEX "business_members_profileId_idx" ON "business_members"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "business_invites_businessId_email_key" ON "business_invites"("businessId", "email");

-- CreateIndex
CREATE INDEX "business_invites_email_status_expiresAt_idx" ON "business_invites"("email", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "business_invites_invitedById_idx" ON "business_invites"("invitedById");

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invites" ADD CONSTRAINT "business_invites_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invites" ADD CONSTRAINT "business_invites_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invites" ADD CONSTRAINT "business_invites_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
