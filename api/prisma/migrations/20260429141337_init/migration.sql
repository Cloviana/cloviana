CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('SITE_AUDIT', 'BUSINESS_INITIALIZATION', 'PROMPT_RESEARCH', 'MONITORING');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PlanName" AS ENUM ('STARTER', 'PRO', 'GROWTH');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'TRIALLING');

-- CreateEnum
CREATE TYPE "BusinessMembershipRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "BusinessInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BusinessSetupStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BusinessSetupStep" AS ENUM ('DOMAIN', 'PROFILE', 'LOCATION', 'COMPETITORS', 'ATTRIBUTION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('LOCKED', 'PROCESSING', 'ACTIVE', 'FAILED');

-- CreateEnum
CREATE TYPE "PromptStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AiEngine" AS ENUM ('CLAUDE', 'CHATGPT', 'PERPLEXITY', 'AI_OVERVIEWS');

-- CreateEnum
CREATE TYPE "PromptRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PromptResponseStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PromptAwarenessStage" AS ENUM ('EXPLORE', 'EVALUATE', 'DECIDE');

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
    "businessId" TEXT NOT NULL,
    "planId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "stripeCustomerId" TEXT,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "icp" TEXT,
    "status" "BusinessStatus" NOT NULL DEFAULT 'LOCKED',
    "setupStatus" "BusinessSetupStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "setupStep" "BusinessSetupStep" NOT NULL DEFAULT 'DOMAIN',
    "setupCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "heardAboutUs" TEXT,
    "heardAboutUsCapturedAt" TIMESTAMP(3),
    "lastAccessedBusinessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "type" "JobType" NOT NULL,
    "businessId" TEXT NOT NULL,
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
CREATE TABLE "prompts" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "PromptStatus" NOT NULL,
    "awarenessStage" "PromptAwarenessStage" NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_runs" (
    "id" UUID NOT NULL,
    "promptId" UUID NOT NULL,
    "status" "PromptRunStatus" NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_responses" (
    "id" UUID NOT NULL,
    "promptRunId" UUID NOT NULL,
    "promptId" UUID NOT NULL,
    "engine" "AiEngine" NOT NULL,
    "text" TEXT,
    "status" "PromptResponseStatus" NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentions" (
    "id" UUID NOT NULL,
    "promptResponseId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "competitorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citations" (
    "id" UUID NOT NULL,
    "promptResponseId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "title" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fan_out_queries" (
    "id" UUID NOT NULL,
    "promptResponseId" UUID NOT NULL,
    "query" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fan_out_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_metrics" (
    "id" UUID NOT NULL,
    "promptId" UUID NOT NULL,
    "competitorId" UUID,
    "date" DATE NOT NULL,
    "mentionRate" DOUBLE PRECISION NOT NULL,
    "citationShare" DOUBLE PRECISION NOT NULL,
    "sov" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_metrics" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "competitorId" UUID,
    "engine" "AiEngine",
    "date" DATE NOT NULL,
    "mentionRate" DOUBLE PRECISION NOT NULL,
    "citationShare" DOUBLE PRECISION NOT NULL,
    "sov" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audits" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "brandName" TEXT,
    "jobId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "visibilityLeaderboard" JSONB,
    "citationLeaderboard" JSONB,
    "sentiment" JSONB,
    "topPages" JSONB,
    "contentSuggestions" JSONB,
    "brandVisibility" JSONB,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PromptToTag" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_PromptToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_stripePriceId_key" ON "plans"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_businessId_key" ON "subscriptions"("businessId");

-- CreateIndex
CREATE INDEX "businesses_ownerId_idx" ON "businesses"("ownerId");

-- CreateIndex
CREATE INDEX "competitors_businessId_idx" ON "competitors"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "competitors_businessId_domain_key" ON "competitors"("businessId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "business_members_profileId_idx" ON "business_members"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "business_members_businessId_profileId_key" ON "business_members"("businessId", "profileId");

-- CreateIndex
CREATE INDEX "business_invites_email_status_expiresAt_idx" ON "business_invites"("email", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "business_invites_invitedById_idx" ON "business_invites"("invitedById");

-- CreateIndex
CREATE UNIQUE INDEX "business_invites_businessId_email_key" ON "business_invites"("businessId", "email");

-- CreateIndex
CREATE INDEX "jobs_type_status_priority_scheduledAt_idx" ON "jobs"("type", "status", "priority", "scheduledAt");

-- CreateIndex
CREATE INDEX "jobs_businessId_type_status_idx" ON "jobs"("businessId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_type_businessId_dedupeKey_key" ON "jobs"("type", "businessId", "dedupeKey");

-- CreateIndex
CREATE INDEX "prompts_businessId_idx" ON "prompts"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "prompts_businessId_text_key" ON "prompts"("businessId", "text");

-- CreateIndex
CREATE UNIQUE INDEX "tags_businessId_text_key" ON "tags"("businessId", "text");

-- CreateIndex
CREATE INDEX "prompt_responses_promptId_idx" ON "prompt_responses"("promptId");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_responses_promptRunId_engine_key" ON "prompt_responses"("promptRunId", "engine");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_metrics_promptId_competitorId_date_key" ON "prompt_metrics"("promptId", "competitorId", "date");

-- CreateIndex
CREATE INDEX "business_metrics_businessId_competitorId_date_engine_idx" ON "business_metrics"("businessId", "competitorId", "date", "engine");

-- CreateIndex
CREATE INDEX "audits_email_idx" ON "audits"("email");

-- CreateIndex
CREATE INDEX "_PromptToTag_B_index" ON "_PromptToTag"("B");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invites" ADD CONSTRAINT "business_invites_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invites" ADD CONSTRAINT "business_invites_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invites" ADD CONSTRAINT "business_invites_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_runs_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_responses" ADD CONSTRAINT "prompt_responses_promptRunId_fkey" FOREIGN KEY ("promptRunId") REFERENCES "prompt_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_responses" ADD CONSTRAINT "prompt_responses_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_promptResponseId_fkey" FOREIGN KEY ("promptResponseId") REFERENCES "prompt_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "competitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citations" ADD CONSTRAINT "citations_promptResponseId_fkey" FOREIGN KEY ("promptResponseId") REFERENCES "prompt_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_out_queries" ADD CONSTRAINT "fan_out_queries_promptResponseId_fkey" FOREIGN KEY ("promptResponseId") REFERENCES "prompt_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_metrics" ADD CONSTRAINT "prompt_metrics_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_metrics" ADD CONSTRAINT "prompt_metrics_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "competitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_metrics" ADD CONSTRAINT "business_metrics_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_metrics" ADD CONSTRAINT "business_metrics_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "competitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromptToTag" ADD CONSTRAINT "_PromptToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromptToTag" ADD CONSTRAINT "_PromptToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
