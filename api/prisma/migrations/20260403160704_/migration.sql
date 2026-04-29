/*
  Warnings:

  - The values [PRODUCT_SYNC,CATALOG_SYNC,BLOG_GENERATION,SITEMAP_BUILD,KEYWORD_DISCOVERY,STORE_METADATA] on the enum `JobType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `contactEmail` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the `_AutopilotBlogSettingsToCollection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BlogToCollection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BlogToProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CollectionToProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `autopilot_blog_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `autopilot_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `blogs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `channels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `collections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `nodes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `thumbnails` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobType_new" AS ENUM ('SITE_AUDIT');
ALTER TABLE "jobs" ALTER COLUMN "type" TYPE "JobType_new" USING ("type"::text::"JobType_new");
ALTER TYPE "JobType" RENAME TO "JobType_old";
ALTER TYPE "JobType_new" RENAME TO "JobType";
DROP TYPE "public"."JobType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."_AutopilotBlogSettingsToCollection" DROP CONSTRAINT "_AutopilotBlogSettingsToCollection_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_AutopilotBlogSettingsToCollection" DROP CONSTRAINT "_AutopilotBlogSettingsToCollection_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_BlogToCollection" DROP CONSTRAINT "_BlogToCollection_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_BlogToCollection" DROP CONSTRAINT "_BlogToCollection_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_BlogToProduct" DROP CONSTRAINT "_BlogToProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_BlogToProduct" DROP CONSTRAINT "_BlogToProduct_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_CollectionToProduct" DROP CONSTRAINT "_CollectionToProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_CollectionToProduct" DROP CONSTRAINT "_CollectionToProduct_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."autopilot_blog_settings" DROP CONSTRAINT "autopilot_blog_settings_autopilotSettingsId_fkey";

-- DropForeignKey
ALTER TABLE "public"."autopilot_settings" DROP CONSTRAINT "autopilot_settings_storeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."blogs" DROP CONSTRAINT "blogs_jobId_fkey";

-- DropForeignKey
ALTER TABLE "public"."blogs" DROP CONSTRAINT "blogs_storeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."channels" DROP CONSTRAINT "channels_storeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."collections" DROP CONSTRAINT "collections_storeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."nodes" DROP CONSTRAINT "nodes_blogId_fkey";

-- DropForeignKey
ALTER TABLE "public"."nodes" DROP CONSTRAINT "nodes_blogId_parentKey_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_storeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."thumbnails" DROP CONSTRAINT "thumbnails_blogId_fkey";

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "contactEmail";

-- AlterTable
ALTER TABLE "stores" DROP COLUMN "platform",
DROP COLUMN "status";

-- DropTable
DROP TABLE "public"."_AutopilotBlogSettingsToCollection";

-- DropTable
DROP TABLE "public"."_BlogToCollection";

-- DropTable
DROP TABLE "public"."_BlogToProduct";

-- DropTable
DROP TABLE "public"."_CollectionToProduct";

-- DropTable
DROP TABLE "public"."autopilot_blog_settings";

-- DropTable
DROP TABLE "public"."autopilot_settings";

-- DropTable
DROP TABLE "public"."blogs";

-- DropTable
DROP TABLE "public"."channels";

-- DropTable
DROP TABLE "public"."collections";

-- DropTable
DROP TABLE "public"."nodes";

-- DropTable
DROP TABLE "public"."products";

-- DropTable
DROP TABLE "public"."thumbnails";

-- DropEnum
DROP TYPE "public"."AutopilotContentMix";

-- DropEnum
DROP TYPE "public"."BlogContentType";

-- DropEnum
DROP TYPE "public"."BlogSetupStep";

-- DropEnum
DROP TYPE "public"."BlogStatus";

-- DropEnum
DROP TYPE "public"."DayOfWeek";

-- DropEnum
DROP TYPE "public"."NodeType";

-- DropEnum
DROP TYPE "public"."Platform";

-- DropEnum
DROP TYPE "public"."ProductStatus";

-- DropEnum
DROP TYPE "public"."SearchIntent";

-- DropEnum
DROP TYPE "public"."StoreStatus";
