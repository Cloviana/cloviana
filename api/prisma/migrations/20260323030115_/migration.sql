/*
  Warnings:

  - You are about to drop the `audit_brands` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_prompt_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_prompts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_result_brands` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_result_sources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_topics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."audit_brands" DROP CONSTRAINT "audit_brands_auditId_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_prompt_results" DROP CONSTRAINT "audit_prompt_results_promptId_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_prompts" DROP CONSTRAINT "audit_prompts_topicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_result_brands" DROP CONSTRAINT "audit_result_brands_resultId_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_result_sources" DROP CONSTRAINT "audit_result_sources_resultId_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_topics" DROP CONSTRAINT "audit_topics_auditId_fkey";

-- AlterTable
ALTER TABLE "audits" ADD COLUMN     "citationLeaderboard" JSONB,
ADD COLUMN     "contentSuggestions" JSONB,
ADD COLUMN     "sentiment" JSONB,
ADD COLUMN     "topPages" JSONB,
ADD COLUMN     "visibilityLeaderboard" JSONB;

-- DropTable
DROP TABLE "public"."audit_brands";

-- DropTable
DROP TABLE "public"."audit_prompt_results";

-- DropTable
DROP TABLE "public"."audit_prompts";

-- DropTable
DROP TABLE "public"."audit_result_brands";

-- DropTable
DROP TABLE "public"."audit_result_sources";

-- DropTable
DROP TABLE "public"."audit_topics";

-- DropEnum
DROP TYPE "public"."AuditEngine";
