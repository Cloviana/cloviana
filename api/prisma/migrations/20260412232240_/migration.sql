/*
  Warnings:

  - The values [PROBLEM_AWARE,SOLUTION_AWARE,VENDOR_AWARE,COMPARISON] on the enum `PromptStage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PromptStage_new" AS ENUM ('EXPLORE', 'EVALUATE', 'DECIDE');
ALTER TABLE "prompts" ALTER COLUMN "stage" TYPE "PromptStage_new" USING ("stage"::text::"PromptStage_new");
ALTER TYPE "PromptStage" RENAME TO "PromptStage_old";
ALTER TYPE "PromptStage_new" RENAME TO "PromptStage";
DROP TYPE "public"."PromptStage_old";
COMMIT;
