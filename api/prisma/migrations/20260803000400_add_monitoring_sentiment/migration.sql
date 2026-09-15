-- CreateEnum
CREATE TYPE "ClaimSentiment" AS ENUM ('POSITIVE', 'NEGATIVE');

-- AlterTable
ALTER TABLE "prompt_metrics"
ADD COLUMN "positiveClaimCount" INTEGER,
ADD COLUMN "negativeClaimCount" INTEGER,
ADD COLUMN "positiveSentimentShare" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "business_metrics"
ADD COLUMN "positiveClaimCount" INTEGER,
ADD COLUMN "negativeClaimCount" INTEGER,
ADD COLUMN "positiveSentimentShare" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "sentiment_claims" (
    "id" UUID NOT NULL,
    "promptResponseId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "sentiment" "ClaimSentiment" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sentiment_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sentiment_evidence" (
    "id" UUID NOT NULL,
    "sentimentClaimId" UUID NOT NULL,
    "startOffset" INTEGER NOT NULL,
    "endOffset" INTEGER NOT NULL,

    CONSTRAINT "sentiment_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sentiment_claims_promptResponseId_sentiment_label_key"
ON "sentiment_claims"("promptResponseId", "sentiment", "label");

-- CreateIndex
CREATE INDEX "sentiment_claims_promptResponseId_idx"
ON "sentiment_claims"("promptResponseId");

-- CreateIndex
CREATE UNIQUE INDEX "sentiment_evidence_sentimentClaimId_startOffset_endOffset_key"
ON "sentiment_evidence"("sentimentClaimId", "startOffset", "endOffset");

-- CreateIndex
CREATE INDEX "sentiment_evidence_sentimentClaimId_startOffset_idx"
ON "sentiment_evidence"("sentimentClaimId", "startOffset");

-- AddForeignKey
ALTER TABLE "sentiment_claims"
ADD CONSTRAINT "sentiment_claims_promptResponseId_fkey"
FOREIGN KEY ("promptResponseId") REFERENCES "prompt_responses"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sentiment_evidence"
ADD CONSTRAINT "sentiment_evidence_sentimentClaimId_fkey"
FOREIGN KEY ("sentimentClaimId") REFERENCES "sentiment_claims"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
