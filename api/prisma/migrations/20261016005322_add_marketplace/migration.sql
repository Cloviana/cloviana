-- CreateEnum
CREATE TYPE "MarketplaceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "marketplaces" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My marketplace',
    "slug" CITEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "status" "MarketplaceStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "marketplaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplaces_slug_key" ON "marketplaces"("slug");

-- CreateIndex
CREATE INDEX "marketplaces_ownerId_idx" ON "marketplaces"("ownerId");

-- AddForeignKey
ALTER TABLE "marketplaces" ADD CONSTRAINT "marketplaces_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
