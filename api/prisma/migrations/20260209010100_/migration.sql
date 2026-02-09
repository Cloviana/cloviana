-- AlterTable
ALTER TABLE "autopilot_blog_settings" ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ALTER COLUMN "publishDays" SET DEFAULT ARRAY['MON']::"DayOfWeek"[];
