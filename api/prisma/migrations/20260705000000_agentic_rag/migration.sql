-- CreateEnum
CREATE TYPE "BlogDraftStatus" AS ENUM ('READY', 'FLAGGED');

-- CreateEnum
CREATE TYPE "CmsPlatform" AS ENUM ('WORDPRESS', 'WEBFLOW', 'FRAMER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobType" ADD VALUE 'BLOG_GENERATION';
ALTER TYPE "JobType" ADD VALUE 'CMS_SYNC';

-- CreateTable
CREATE TABLE "blog_drafts" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "jobId" UUID,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "BlogDraftStatus" NOT NULL DEFAULT 'READY',
    "violations" JSONB,
    "sources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_connections" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "platform" "CmsPlatform" NOT NULL,
    "config" JSONB NOT NULL,
    "syncCursor" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_pages" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "platform" "CmsPlatform" NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "excerpt" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "cluster" TEXT,
    "publishedDate" TIMESTAMP(3),
    "lastModified" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blog_drafts_businessId_createdAt_idx" ON "blog_drafts"("businessId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cms_connections_businessId_platform_key" ON "cms_connections"("businessId", "platform");

-- CreateIndex
CREATE INDEX "cms_pages_businessId_idx" ON "cms_pages"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "cms_pages_businessId_platform_externalId_key" ON "cms_pages"("businessId", "platform", "externalId");

-- AddForeignKey
ALTER TABLE "blog_drafts" ADD CONSTRAINT "blog_drafts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_connections" ADD CONSTRAINT "cms_connections_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_pages" ADD CONSTRAINT "cms_pages_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

