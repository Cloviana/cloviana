/*
  Warnings:

  - Added the required column `awarenessStage` to the `prompts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PromptAwarenessStage" AS ENUM ('EXPLORE', 'EVALUATE', 'DECIDE');

-- AlterTable
ALTER TABLE "prompts" ADD COLUMN     "awarenessStage" "PromptAwarenessStage" NOT NULL;
