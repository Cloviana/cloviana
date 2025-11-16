CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('DRAFT', 'ACTIVE', 'LOCKED', 'INITIALIZING', 'FAILED');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('PARAGRAPH', 'HEADING', 'LIST', 'LIST_ITEM', 'CODE_BLOCK', 'QUOTE', 'IMAGE', 'LINK', 'TEXT', 'LINEBREAK');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BlogSetupStep" AS ENUM ('TOPIC', 'PRIMARY_KEYWORD', 'TITLE', 'SECONDARY_KEYWORDS', 'PRODUCT', 'ENHANCEMENTS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('PRODUCT_SYNC', 'BLOG_GENERATION', 'SITEMAP_BUILD', 'KEYWORD_DISCOVERY', 'STORE_METADATA');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PlanName" AS ENUM ('STARTER', 'PRO', 'GROWTH');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'TRIALLING');

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "name" "PlanName" NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeSubscriptionId" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "storeId" TEXT NOT NULL,
    "planId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "type" "JobType" NOT NULL,
    "storeId" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "lastHeartbeatAt" TIMESTAMP(3),
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "storeId" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "handle" CITEXT,
    "title" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "imageUrl" TEXT,
    "onlineStoreUrl" TEXT,
    "onlineStorePreviewUrl" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "contactEmail" CITEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "stripeCustomerId" TEXT,
    "name" TEXT NOT NULL,
    "domainUrl" TEXT NOT NULL,
    "profileUrl" TEXT,
    "description" TEXT,
    "status" "StoreStatus" NOT NULL DEFAULT 'LOCKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" UUID NOT NULL,
    "shop" CITEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogs" (
    "id" UUID NOT NULL,
    "topic" TEXT,
    "title" TEXT,
    "slug" TEXT,
    "description" TEXT,
    "brandVoice" TEXT,
    "primaryKeyword" TEXT,
    "secondaryKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "additionalInstruction" TEXT,
    "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" "BlogSetupStep" NOT NULL DEFAULT 'TOPIC',
    "storeId" TEXT NOT NULL,
    "shopifyArticleId" TEXT,
    "jobId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "blogId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "parentKey" TEXT,
    "type" "NodeType" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("blogId","key")
);

-- CreateTable
CREATE TABLE "thumbnails" (
    "id" UUID NOT NULL,
    "blogId" UUID NOT NULL,
    "altText" TEXT NOT NULL,
    "blobPath" TEXT NOT NULL,

    CONSTRAINT "thumbnails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BlogToProduct" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_BlogToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_stripePriceId_key" ON "plans"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_storeId_key" ON "subscriptions"("storeId");

-- CreateIndex
CREATE INDEX "jobs_type_status_priority_scheduledAt_idx" ON "jobs"("type", "status", "priority", "scheduledAt");

-- CreateIndex
CREATE INDEX "jobs_storeId_type_status_idx" ON "jobs"("storeId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_type_storeId_dedupeKey_key" ON "jobs"("type", "storeId", "dedupeKey");

-- CreateIndex
CREATE INDEX "products_storeId_status_idx" ON "products"("storeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "products_storeId_handle_key" ON "products"("storeId", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "products_storeId_shopifyId_key" ON "products"("storeId", "shopifyId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "stores_ownerId_idx" ON "stores"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "channels_shop_key" ON "channels"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "channels_storeId_key" ON "channels"("storeId");

-- CreateIndex
CREATE INDEX "blogs_storeId_idx" ON "blogs"("storeId");

-- CreateIndex
CREATE INDEX "nodes_blogId_parentKey_sortOrder_idx" ON "nodes"("blogId", "parentKey", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "thumbnails_blogId_key" ON "thumbnails"("blogId");

-- CreateIndex
CREATE INDEX "_BlogToProduct_B_index" ON "_BlogToProduct"("B");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_blogId_parentKey_fkey" FOREIGN KEY ("blogId", "parentKey") REFERENCES "nodes"("blogId", "key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thumbnails" ADD CONSTRAINT "thumbnails_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogToProduct" ADD CONSTRAINT "_BlogToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogToProduct" ADD CONSTRAINT "_BlogToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
