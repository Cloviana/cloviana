/*
  Warnings:

  - You are about to drop the column `additionalInstruction` on the `blogs` table. All the data in the column will be lost.
  - You are about to drop the column `searchIntent` on the `blogs` table. All the data in the column will be lost.
  - You are about to drop the column `targetPersona` on the `blogs` table. All the data in the column will be lost.
  - You are about to drop the column `wordCount` on the `blogs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "blogs" DROP COLUMN "additionalInstruction",
DROP COLUMN "searchIntent",
DROP COLUMN "targetPersona",
DROP COLUMN "wordCount";
