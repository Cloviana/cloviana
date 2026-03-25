CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('DRAFT', 'ACTIVE', 'LOCKED', 'INITIALIZING', 'FAILED');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('SHOPIFY', 'WOOCOMMERCE', 'BIGCOMMERCE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('PARAGRAPH', 'HEADING', 'LIST', 'LIST_ITEM', 'CODE_BLOCK', 'QUOTE', 'IMAGE', 'LINK', 'TEXT', 'LINEBREAK');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BlogSetupStep" AS ENUM ('TOPIC', 'PRIMARY_KEYWORD', 'SECONDARY_KEYWORDS', 'PRODUCT', 'CONTENT_TYPE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BlogContentType" AS ENUM ('PROBLEM_SOLUTION', 'COMPARISON');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('PRODUCT_SYNC', 'CATALOG_SYNC', 'BLOG_GENERATION', 'SITEMAP_BUILD', 'KEYWORD_DISCOVERY', 'STORE_METADATA', 'SITE_AUDIT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PlanName" AS ENUM ('STARTER', 'PRO', 'GROWTH');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'TRIALLING');

-- CreateEnum
CREATE TYPE "SearchIntent" AS ENUM ('INFORMATIONAL', 'NAVIGATIONAL', 'COMMERCIAL', 'TRANSACTIONAL');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "AutopilotContentMix" AS ENUM ('BALANCED', 'PROBLEM_SOLUTION', 'COMPARISON');

-- CreateEnum
CREATE TYPE "AuditEngine" AS ENUM ('GOOGLE_AIO', 'CHATGPT', 'PERPLEXITY');

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
CREATE TABLE "autopilot_settings" (
    "id" UUID NOT NULL,
    "storeId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autopilot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autopilot_blog_settings" (
    "id" UUID NOT NULL,
    "autopilotSettingsId" UUID NOT NULL,
    "publishDays" "DayOfWeek"[] DEFAULT ARRAY['MON']::"DayOfWeek"[],
    "contentMix" "AutopilotContentMix" NOT NULL DEFAULT 'BALANCED',
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autopilot_blog_settings_pkey" PRIMARY KEY ("id")
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
    "platform" "Platform" NOT NULL DEFAULT 'SHOPIFY',
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
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "contactEmail" CITEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "storeId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" CITEXT,
    "status" "ProductStatus" NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "url" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "storeId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" CITEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "url" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogs" (
    "id" UUID NOT NULL,
    "topic" TEXT,
    "title" TEXT,
    "slug" TEXT,
    "description" TEXT,
    "contentType" "BlogContentType",
    "brandVoice" TEXT,
    "primaryKeyword" TEXT,
    "secondaryKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" "BlogSetupStep" NOT NULL DEFAULT 'CONTENT_TYPE',
    "storeId" TEXT NOT NULL,
    "externalId" TEXT,
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
CREATE TABLE "audits" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "brandName" TEXT,
    "jobId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_topics" (
    "id" UUID NOT NULL,
    "auditId" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "audit_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_prompts" (
    "id" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "audit_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_prompt_results" (
    "id" UUID NOT NULL,
    "promptId" UUID NOT NULL,
    "engine" "AuditEngine" NOT NULL,
    "response" TEXT NOT NULL,

    CONSTRAINT "audit_prompt_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_result_sources" (
    "id" UUID NOT NULL,
    "resultId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "audit_result_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_result_brands" (
    "id" UUID NOT NULL,
    "resultId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,

    CONSTRAINT "audit_result_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_brands" (
    "id" UUID NOT NULL,
    "auditId" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT,
    "visibilityGoogleAio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visibilityChatgpt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visibilityPerplexity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visibilityOverall" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "citationGoogleAio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "citationChatgpt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "citationPerplexity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "citationOverall" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "audit_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AutopilotBlogSettingsToCollection" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AutopilotBlogSettingsToCollection_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CollectionToProduct" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CollectionToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BlogToProduct" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_BlogToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BlogToCollection" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_BlogToCollection_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_stripePriceId_key" ON "plans"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_storeId_key" ON "subscriptions"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "autopilot_settings_storeId_key" ON "autopilot_settings"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "autopilot_blog_settings_autopilotSettingsId_key" ON "autopilot_blog_settings"("autopilotSettingsId");

-- CreateIndex
CREATE INDEX "stores_ownerId_idx" ON "stores"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "channels_shop_key" ON "channels"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "channels_storeId_key" ON "channels"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "products_storeId_status_idx" ON "products"("storeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "products_storeId_externalId_key" ON "products"("storeId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "products_storeId_slug_key" ON "products"("storeId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "collections_storeId_externalId_key" ON "collections"("storeId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "collections_storeId_slug_key" ON "collections"("storeId", "slug");

-- CreateIndex
CREATE INDEX "blogs_storeId_idx" ON "blogs"("storeId");

-- CreateIndex
CREATE INDEX "nodes_blogId_parentKey_sortOrder_idx" ON "nodes"("blogId", "parentKey", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "thumbnails_blogId_key" ON "thumbnails"("blogId");

-- CreateIndex
CREATE INDEX "jobs_type_status_priority_scheduledAt_idx" ON "jobs"("type", "status", "priority", "scheduledAt");

-- CreateIndex
CREATE INDEX "jobs_storeId_type_status_idx" ON "jobs"("storeId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_type_storeId_dedupeKey_key" ON "jobs"("type", "storeId", "dedupeKey");

-- CreateIndex
CREATE INDEX "audits_email_idx" ON "audits"("email");

-- CreateIndex
CREATE UNIQUE INDEX "audit_prompt_results_promptId_engine_key" ON "audit_prompt_results"("promptId", "engine");

-- CreateIndex
CREATE UNIQUE INDEX "audit_brands_auditId_domain_key" ON "audit_brands"("auditId", "domain");

-- CreateIndex
CREATE INDEX "_AutopilotBlogSettingsToCollection_B_index" ON "_AutopilotBlogSettingsToCollection"("B");

-- CreateIndex
CREATE INDEX "_CollectionToProduct_B_index" ON "_CollectionToProduct"("B");

-- CreateIndex
CREATE INDEX "_BlogToProduct_B_index" ON "_BlogToProduct"("B");

-- CreateIndex
CREATE INDEX "_BlogToCollection_B_index" ON "_BlogToCollection"("B");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autopilot_settings" ADD CONSTRAINT "autopilot_settings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autopilot_blog_settings" ADD CONSTRAINT "autopilot_blog_settings_autopilotSettingsId_fkey" FOREIGN KEY ("autopilotSettingsId") REFERENCES "autopilot_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_blogId_parentKey_fkey" FOREIGN KEY ("blogId", "parentKey") REFERENCES "nodes"("blogId", "key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thumbnails" ADD CONSTRAINT "thumbnails_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_topics" ADD CONSTRAINT "audit_topics_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_prompts" ADD CONSTRAINT "audit_prompts_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "audit_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_prompt_results" ADD CONSTRAINT "audit_prompt_results_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "audit_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_result_sources" ADD CONSTRAINT "audit_result_sources_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "audit_prompt_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_result_brands" ADD CONSTRAINT "audit_result_brands_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "audit_prompt_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_brands" ADD CONSTRAINT "audit_brands_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AutopilotBlogSettingsToCollection" ADD CONSTRAINT "_AutopilotBlogSettingsToCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "autopilot_blog_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AutopilotBlogSettingsToCollection" ADD CONSTRAINT "_AutopilotBlogSettingsToCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionToProduct" ADD CONSTRAINT "_CollectionToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionToProduct" ADD CONSTRAINT "_CollectionToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogToProduct" ADD CONSTRAINT "_BlogToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogToProduct" ADD CONSTRAINT "_BlogToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogToCollection" ADD CONSTRAINT "_BlogToCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogToCollection" ADD CONSTRAINT "_BlogToCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
