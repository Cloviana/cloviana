-- DropIndex
DROP INDEX "public"."business_metrics_businessId_competitorId_date_key";

-- AlterTable
ALTER TABLE "business_metrics" ADD COLUMN     "engine" "AiEngine";

-- CreateIndex
CREATE INDEX "business_metrics_businessId_competitorId_date_engine_idx" ON "business_metrics"("businessId", "competitorId", "date", "engine");
