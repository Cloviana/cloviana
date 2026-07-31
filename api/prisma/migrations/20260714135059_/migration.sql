/*
  Warnings:

  - The values [BLOG_GENERATION,CMS_SYNC] on the enum `JobType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobType_new" AS ENUM ('SITE_AUDIT', 'BUSINESS_INITIALIZATION', 'PROMPT_RESEARCH', 'PROMPT_GENERATION', 'MONITORING');
ALTER TABLE "jobs" ALTER COLUMN "type" TYPE "JobType_new" USING ("type"::text::"JobType_new");
ALTER TYPE "JobType" RENAME TO "JobType_old";
ALTER TYPE "JobType_new" RENAME TO "JobType";
DROP TYPE "public"."JobType_old";
COMMIT;

-- AlterTable
ALTER TABLE "folders" ALTER COLUMN "id" DROP DEFAULT;
