ALTER TABLE "mentions" DROP CONSTRAINT "mentions_competitorId_fkey";
ALTER TABLE "prompt_metrics" DROP CONSTRAINT "prompt_metrics_competitorId_fkey";
ALTER TABLE "business_metrics" DROP CONSTRAINT "business_metrics_competitorId_fkey";

ALTER TABLE "mentions"
ADD CONSTRAINT "mentions_competitorId_fkey"
FOREIGN KEY ("competitorId") REFERENCES "competitors"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prompt_metrics"
ADD CONSTRAINT "prompt_metrics_competitorId_fkey"
FOREIGN KEY ("competitorId") REFERENCES "competitors"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "business_metrics"
ADD CONSTRAINT "business_metrics_competitorId_fkey"
FOREIGN KEY ("competitorId") REFERENCES "competitors"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "mentions_competitorId_idx" ON "mentions"("competitorId");
CREATE INDEX "prompt_metrics_competitorId_idx" ON "prompt_metrics"("competitorId");
CREATE INDEX "business_metrics_competitorId_idx" ON "business_metrics"("competitorId");
