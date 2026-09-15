-- AlterTable
ALTER TABLE "sentiment_claims"
ADD COLUMN "brandId" UUID;

-- Backfill: before this change only the business was ever analysed, so every
-- existing claim belongs to its business's own brand. Without this, historical
-- sentiment reads as null once the metrics start filtering by brand.
UPDATE "sentiment_claims" sc
SET "brandId" = b."id"
FROM "prompt_responses" pr
JOIN "prompts" p ON p."id" = pr."promptId"
JOIN "brands" b ON b."businessId" = p."businessId" AND b."kind" = 'BUSINESS'
WHERE sc."promptResponseId" = pr."id" AND sc."brandId" IS NULL;

-- DropIndex
-- Two brands in one answer can carry the same label and sentiment, so the
-- brand becomes part of a claim's identity.
DROP INDEX "sentiment_claims_promptResponseId_sentiment_label_key";

-- CreateIndex
CREATE UNIQUE INDEX "sentiment_claims_promptResponseId_brandId_sentiment_label_key"
ON "sentiment_claims"("promptResponseId", "brandId", "sentiment", "label");

-- CreateIndex
CREATE INDEX "sentiment_claims_brandId_idx" ON "sentiment_claims"("brandId");

-- AddForeignKey
ALTER TABLE "sentiment_claims"
ADD CONSTRAINT "sentiment_claims_brandId_fkey"
FOREIGN KEY ("brandId") REFERENCES "brands"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
