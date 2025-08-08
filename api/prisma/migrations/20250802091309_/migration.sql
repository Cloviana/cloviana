-- AlterEnum
ALTER TYPE "GenerationStep" ADD VALUE 'TOPIC';

-- AlterTable
ALTER TABLE "blogs" ADD COLUMN     "topic" TEXT,
ALTER COLUMN "generationStep" DROP NOT NULL,
ALTER COLUMN "generationStep" DROP DEFAULT;
