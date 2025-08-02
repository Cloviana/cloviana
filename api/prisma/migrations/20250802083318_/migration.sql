/*
  Warnings:

  - You are about to drop the column `type` on the `blogs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "GenerationStep" AS ENUM ('KEYWORD', 'COMPETITORS', 'TITLE', 'SECONDARY_KEYWORDS', 'META', 'REVIEW', 'COMPLETE');

-- AlterTable
ALTER TABLE "blogs" DROP COLUMN "type",
ADD COLUMN     "generationStep" "GenerationStep" NOT NULL DEFAULT 'KEYWORD',
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "keywordId" DROP NOT NULL;
