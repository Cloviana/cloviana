-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "AutopilotContentMix" AS ENUM ('BALANCED', 'PROBLEM_SOLUTION', 'COMPARISON');

-- AlterTable
ALTER TABLE "blogs" ALTER COLUMN "currentStep" SET DEFAULT 'CONTENT_TYPE';

-- DropEnum
DROP TYPE "public"."WordCountPreset";

-- CreateTable
CREATE TABLE "autopilot_settings" (
    "id" UUID NOT NULL,
    "storeId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autopilot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autopilot_blog_settings" (
    "id" UUID NOT NULL,
    "autopilotSettingsId" UUID NOT NULL,
    "publishDays" "DayOfWeek"[] DEFAULT ARRAY[]::"DayOfWeek"[],
    "contentMix" "AutopilotContentMix" NOT NULL DEFAULT 'BALANCED',
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autopilot_blog_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AutopilotBlogSettingsToCollection" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AutopilotBlogSettingsToCollection_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "autopilot_settings_storeId_key" ON "autopilot_settings"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "autopilot_blog_settings_autopilotSettingsId_key" ON "autopilot_blog_settings"("autopilotSettingsId");

-- CreateIndex
CREATE INDEX "_AutopilotBlogSettingsToCollection_B_index" ON "_AutopilotBlogSettingsToCollection"("B");

-- AddForeignKey
ALTER TABLE "autopilot_settings" ADD CONSTRAINT "autopilot_settings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autopilot_blog_settings" ADD CONSTRAINT "autopilot_blog_settings_autopilotSettingsId_fkey" FOREIGN KEY ("autopilotSettingsId") REFERENCES "autopilot_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AutopilotBlogSettingsToCollection" ADD CONSTRAINT "_AutopilotBlogSettingsToCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "autopilot_blog_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AutopilotBlogSettingsToCollection" ADD CONSTRAINT "_AutopilotBlogSettingsToCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
