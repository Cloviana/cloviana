/*
  Warnings:

  - The values [TITLE,ENHANCEMENTS] on the enum `BlogSetupStep` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "SearchIntent" AS ENUM ('INFORMATIONAL', 'NAVIGATIONAL', 'COMMERCIAL', 'TRANSACTIONAL');

-- CreateEnum
CREATE TYPE "WordCountPreset" AS ENUM ('SHORT', 'MEDIUM', 'LONG');

-- AlterEnum
BEGIN;
CREATE TYPE "BlogSetupStep_new" AS ENUM ('TOPIC', 'PRIMARY_KEYWORD', 'SECONDARY_KEYWORDS', 'PRODUCT', 'AUDIENCE_INTENT', 'GUIDELINES', 'COMPLETED');
ALTER TABLE "public"."blogs" ALTER COLUMN "currentStep" DROP DEFAULT;
ALTER TABLE "blogs" ALTER COLUMN "currentStep" TYPE "BlogSetupStep_new" USING ("currentStep"::text::"BlogSetupStep_new");
ALTER TYPE "BlogSetupStep" RENAME TO "BlogSetupStep_old";
ALTER TYPE "BlogSetupStep_new" RENAME TO "BlogSetupStep";
DROP TYPE "public"."BlogSetupStep_old";
ALTER TABLE "blogs" ALTER COLUMN "currentStep" SET DEFAULT 'PRODUCT';
COMMIT;

-- AlterTable
ALTER TABLE "blogs" ADD COLUMN     "searchIntent" "SearchIntent",
ADD COLUMN     "targetPersona" TEXT,
ADD COLUMN     "wordCount" "WordCountPreset",
ALTER COLUMN "currentStep" SET DEFAULT 'PRODUCT';
