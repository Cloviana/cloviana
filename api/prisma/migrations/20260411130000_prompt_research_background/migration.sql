-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('LOCKED', 'PROCESSING', 'ACTIVE', 'FAILED');

-- CreateEnum
CREATE TYPE "PromptStage" AS ENUM ('PROBLEM_AWARE', 'SOLUTION_AWARE', 'VENDOR_AWARE', 'COMPARISON');

-- CreateEnum
CREATE TYPE "PromptStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterEnum
ALTER TYPE "JobType" ADD VALUE 'PROMPT_RESEARCH';

-- AlterEnum
ALTER TYPE "JobType" ADD VALUE 'BUSINESS_INITIALIZATION';

-- AlterTable
ALTER TABLE "businesses"
ADD COLUMN "category" TEXT,
ADD COLUMN "status" "BusinessStatus" NOT NULL DEFAULT 'LOCKED';

-- CreateTable
CREATE TABLE "prompts" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "stage" "PromptStage" NOT NULL,
    "status" "PromptStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prompts_businessId_text_key" ON "prompts"("businessId", "text");

-- CreateIndex
CREATE INDEX "prompts_businessId_idx" ON "prompts"("businessId");

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
