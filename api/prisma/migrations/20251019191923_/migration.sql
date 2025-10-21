CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateEnum
CREATE TYPE "public"."StoreStatus" AS ENUM ('DRAFT', 'ACTIVE', 'LOCKED', 'INITIALIZING', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."NodeType" AS ENUM ('PARAGRAPH', 'HEADING', 'LIST', 'LIST_ITEM', 'CODE_BLOCK', 'QUOTE', 'IMAGE', 'LINK', 'TEXT');

-- CreateEnum
CREATE TYPE "public"."BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."BlogSetupStep" AS ENUM ('TOPIC', 'PRIMARY_KEYWORD', 'TITLE', 'SECONDARY_KEYWORDS', 'PRODUCT', 'ENHANCEMENTS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('PRODUCT_SYNC', 'BLOG_GENERATION', 'SITEMAP_BUILD', 'KEYWORD_DISCOVERY', 'STORE_METADATA');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" UUID NOT NULL,
    "type" "public"."JobType" NOT NULL,
    "storeId" TEXT,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE TABLE "public"."products" (
    "id" UUID NOT NULL,
    "storeId" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "handle" CITEXT,
    "title" TEXT NOT NULL,
    "status" "public"."ProductStatus" NOT NULL,
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
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stores" (
    "id" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "stripeCustomerId" TEXT,
    "name" TEXT NOT NULL,
    "domainUrl" TEXT NOT NULL,
    "profileUrl" TEXT,
    "description" TEXT,
    "status" "public"."StoreStatus" NOT NULL DEFAULT 'LOCKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."channels" (
    "id" UUID NOT NULL,
    "shop" CITEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blogs" (
    "id" UUID NOT NULL,
    "topic" TEXT,
    "title" TEXT,
    "slug" TEXT,
    "description" TEXT,
    "brandVoice" TEXT,
    "primaryKeyword" TEXT,
    "secondaryKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "additionalInstruction" TEXT,
    "status" "public"."BlogStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" "public"."BlogSetupStep" NOT NULL DEFAULT 'TOPIC',
    "storeId" TEXT NOT NULL,
    "shopifyArticleId" TEXT,
    "jobId" UUID,
    "productId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."nodes" (
    "blogId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "parentKey" TEXT,
    "type" "public"."NodeType" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("blogId","key")
);

-- CreateTable
CREATE TABLE "public"."thumbnails" (
    "id" UUID NOT NULL,
    "blogId" UUID NOT NULL,
    "altText" TEXT NOT NULL,
    "blobPath" TEXT NOT NULL,

    CONSTRAINT "thumbnails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jobs_type_status_priority_scheduledAt_idx" ON "public"."jobs"("type", "status", "priority", "scheduledAt");

-- CreateIndex
CREATE INDEX "jobs_storeId_type_status_idx" ON "public"."jobs"("storeId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_type_storeId_dedupeKey_key" ON "public"."jobs"("type", "storeId", "dedupeKey");

-- CreateIndex
CREATE INDEX "products_storeId_status_idx" ON "public"."products"("storeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "products_storeId_handle_key" ON "public"."products"("storeId", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "products_storeId_shopifyId_key" ON "public"."products"("storeId", "shopifyId");

-- CreateIndex
CREATE INDEX "stores_ownerId_idx" ON "public"."stores"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "channels_shop_key" ON "public"."channels"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "channels_storeId_key" ON "public"."channels"("storeId");

-- CreateIndex
CREATE INDEX "blogs_storeId_idx" ON "public"."blogs"("storeId");

-- CreateIndex
CREATE INDEX "blogs_productId_idx" ON "public"."blogs"("productId");

-- CreateIndex
CREATE INDEX "nodes_blogId_parentKey_sortOrder_idx" ON "public"."nodes"("blogId", "parentKey", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "thumbnails_blogId_key" ON "public"."thumbnails"("blogId");

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stores" ADD CONSTRAINT "stores_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."channels" ADD CONSTRAINT "channels_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."blogs" ADD CONSTRAINT "blogs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."blogs" ADD CONSTRAINT "blogs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."blogs" ADD CONSTRAINT "blogs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."nodes" ADD CONSTRAINT "nodes_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "public"."blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."nodes" ADD CONSTRAINT "nodes_blogId_parentKey_fkey" FOREIGN KEY ("blogId", "parentKey") REFERENCES "public"."nodes"("blogId", "key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."thumbnails" ADD CONSTRAINT "thumbnails_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "public"."blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
