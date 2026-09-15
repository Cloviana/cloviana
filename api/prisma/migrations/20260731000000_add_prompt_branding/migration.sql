-- CreateEnum
CREATE TYPE "PromptBranding" AS ENUM ('BRANDED', 'UNBRANDED');

-- AlterTable
ALTER TABLE "prompts"
ADD COLUMN "branding" "PromptBranding" NOT NULL DEFAULT 'UNBRANDED';

ALTER TABLE "prompts"
ALTER COLUMN "branding" DROP DEFAULT;
