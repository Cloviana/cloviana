-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "onboardedAt" TIMESTAMPTZ(3);

-- Existing users predate onboarding; do not route them through it.
UPDATE "profiles" SET "onboardedAt" = now();
