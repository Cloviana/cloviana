/*
  Warnings:

  - You are about to drop the column `firstName` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `profileUrl` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."JobType" ADD VALUE 'CREATE_METADATA';

-- AlterTable
ALTER TABLE "public"."blogs" ADD COLUMN     "jobId" UUID;

-- AlterTable
ALTER TABLE "public"."profiles" DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "profileUrl";

-- AlterTable
ALTER TABLE "public"."stores" ADD COLUMN     "description" TEXT;

-- AddForeignKey
ALTER TABLE "public"."blogs" ADD CONSTRAINT "blogs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
