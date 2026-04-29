/*
  Warnings:

  - You are about to drop the column `location` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `primaryLanguage` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `competitors` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Business" DROP COLUMN "location",
DROP COLUMN "primaryLanguage",
ADD COLUMN     "icp" TEXT;

-- AlterTable
ALTER TABLE "competitors" DROP COLUMN "name";
