/*
  Warnings:

  - You are about to drop the `blocks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "blocks" DROP CONSTRAINT "blocks_blogId_fkey";

-- DropTable
DROP TABLE "blocks";

-- DropEnum
DROP TYPE "BlockType";
