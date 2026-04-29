-- CreateEnum
CREATE TYPE "BusinessSetupStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BusinessSetupStep" AS ENUM ('DOMAIN', 'PROFILE', 'LOCATION', 'COMPETITORS', 'ATTRIBUTION', 'COMPLETED');

-- AlterTable
ALTER TABLE "profiles"
ADD COLUMN "heardAboutUs" TEXT,
ADD COLUMN "heardAboutUsCapturedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "stores"
ADD COLUMN "location" TEXT,
ADD COLUMN "primaryLanguage" TEXT,
ADD COLUMN "competitors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "setupStatus" "BusinessSetupStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "setupStep" "BusinessSetupStep" NOT NULL DEFAULT 'DOMAIN',
ADD COLUMN "setupCompletedAt" TIMESTAMP(3);
