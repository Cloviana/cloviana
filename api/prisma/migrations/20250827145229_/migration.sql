/*
  Warnings:

  - The values [CREATE_METADATA] on the enum `JobType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."JobType_new" AS ENUM ('PRODUCT_SYNC', 'BLOG_GENERATION', 'SITEMAP_BUILD', 'KEYWORD_DISCOVERY', 'STORE_METADATA');
ALTER TABLE "public"."jobs" ALTER COLUMN "type" TYPE "public"."JobType_new" USING ("type"::text::"public"."JobType_new");
ALTER TYPE "public"."JobType" RENAME TO "JobType_old";
ALTER TYPE "public"."JobType_new" RENAME TO "JobType";
DROP TYPE "public"."JobType_old";
COMMIT;
