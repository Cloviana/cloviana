/*
  Warnings:

  - The values [AUDIENCE_INTENT,GUIDELINES] on the enum `BlogSetupStep` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "BlogContentType" AS ENUM ('PROBLEM_SOLUTION', 'COMPARISON');

-- AlterEnum
BEGIN;
CREATE TYPE "BlogSetupStep_new" AS ENUM ('TOPIC', 'PRIMARY_KEYWORD', 'SECONDARY_KEYWORDS', 'PRODUCT', 'CONTENT_TYPE', 'COMPLETED');
ALTER TABLE "public"."blogs" ALTER COLUMN "currentStep" DROP DEFAULT;
ALTER TABLE "blogs" ALTER COLUMN "currentStep" TYPE "BlogSetupStep_new" USING ("currentStep"::text::"BlogSetupStep_new");
ALTER TYPE "BlogSetupStep" RENAME TO "BlogSetupStep_old";
ALTER TYPE "BlogSetupStep_new" RENAME TO "BlogSetupStep";
DROP TYPE "public"."BlogSetupStep_old";
ALTER TABLE "blogs" ALTER COLUMN "currentStep" SET DEFAULT 'PRODUCT';
COMMIT;

-- AlterTable
ALTER TABLE "blogs" ADD COLUMN     "contentType" "BlogContentType";
