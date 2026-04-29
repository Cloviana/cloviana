/*
  Warnings:

  - You are about to drop the column `stage` on the `prompts` table. All the data in the column will be lost.
  - Added the required column `name` to the `competitors` table without a default value. This is not possible if the table is not empty.
  - Made the column `businessId` on table `jobs` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AiEngine" AS ENUM ('CLAUDE', 'CHATGPT', 'PERPLEXITY', 'AI_OVERVIEWS');

-- CreateEnum
CREATE TYPE "PromptRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PromptResponseStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "businesses" ALTER COLUMN "domain" DROP NOT NULL;

-- AlterTable
ALTER TABLE "competitors" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "jobs" ALTER COLUMN "businessId" SET NOT NULL;

-- AlterTable
ALTER TABLE "prompts" DROP COLUMN "stage",
ADD COLUMN     "lastRunAt" TIMESTAMP(3);

-- DropEnum
DROP TYPE "public"."PromptStage";

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_tags" (
    "id" UUID NOT NULL,
    "promptId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_tags_pkey" PRIMARY KEY ("id")
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
    "date" DATE NOT NULL,
    "mentionRate" DOUBLE PRECISION NOT NULL,
    "citationShare" DOUBLE PRECISION NOT NULL,
    "sov" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_businessId_text_key" ON "tags"("businessId", "text");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_tags_promptId_tagId_key" ON "prompt_tags"("promptId", "tagId");

-- CreateIndex
CREATE INDEX "prompt_responses_promptId_idx" ON "prompt_responses"("promptId");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_responses_promptRunId_engine_key" ON "prompt_responses"("promptRunId", "engine");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_metrics_promptId_competitorId_date_key" ON "prompt_metrics"("promptId", "competitorId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "business_metrics_businessId_competitorId_date_key" ON "business_metrics"("businessId", "competitorId", "date");

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_tags" ADD CONSTRAINT "prompt_tags_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_tags" ADD CONSTRAINT "prompt_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
