-- Brands unify the business's own tracked identity and its competitors into
-- one table. This replaces two things at once:
--   1. The old convention where a nullable competitorId on Mention /
--      PromptMetric / BusinessMetric meant "this is the business itself".
--   2. The separate Competitor table, which only ever existed to shadow
--      Brand and required every write to keep both in sync.
-- See prisma/schema.prisma's Brand model comment for the full rationale.
--
-- NOT YET APPLIED. Before running this against real data, spot-check the
-- mentions backfill below (the one marked "best-effort") against production
-- data — see that section for why.

-- CreateEnum
CREATE TYPE "BrandKind" AS ENUM ('BUSINESS', 'COMPETITOR');

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "kind" "BrandKind" NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brands_businessId_idx" ON "brands"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_businessId_domain_key" ON "brands"("businessId", "domain");

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one BUSINESS-kind brand per business, from the business's own
-- name/domain.
INSERT INTO "brands" ("id", "businessId", "kind", "domain", "name", "aliases", "createdAt", "updatedAt")
SELECT uuid_generate_v4(), "id", 'BUSINESS', "domain", "name", ARRAY[]::TEXT[], "createdAt", "updatedAt"
FROM "businesses";

-- Backfill: one COMPETITOR-kind brand per existing competitor, carrying its
-- aliases over unchanged.
INSERT INTO "brands" ("id", "businessId", "kind", "domain", "name", "aliases", "createdAt", "updatedAt")
SELECT uuid_generate_v4(), "businessId", 'COMPETITOR', "domain", "name", "aliases", "createdAt", "updatedAt"
FROM "competitors";

-- RenameColumn
-- "position" was extraction order, not a SERP-style rank — renamed to avoid
-- colliding with that not-yet-built concept. See Mention's schema comment.
ALTER TABLE "mentions" RENAME COLUMN "position" TO "order";

-- RenameColumn
ALTER TABLE "citations" RENAME COLUMN "position" TO "order";

-- AlterTable
ALTER TABLE "mentions" ADD COLUMN "brandId" UUID;

-- Backfill mentions.brandId, matched by domain against the mentioning
-- response's own business. This is best-effort: mentions.domain was
-- normalized by application code at write time (see normalizeDomain.util.ts)
-- and may not byte-match a business/competitor's raw domain column in every
-- case (e.g. a leading "www." or differing case that normalization handles
-- but this raw SQL match does not). Verify the row count below against
-- count(*) from mentions before assuming full coverage.
UPDATE "mentions" m
SET "brandId" = b."id"
FROM "prompt_responses" pr
JOIN "prompts" p ON p."id" = pr."promptId"
JOIN "brands" b ON b."businessId" = p."businessId"
WHERE m."promptResponseId" = pr."id" AND LOWER(b."domain") = LOWER(m."domain");

-- Fallback for any mention the domain match above missed: use its recorded
-- competitorId (bridged through the still-live competitors table) or, if it
-- had none, the business's own brand.
UPDATE "mentions" m
SET "brandId" = b."id"
FROM "competitors" c
JOIN "brands" b ON b."businessId" = c."businessId" AND b."kind" = 'COMPETITOR' AND b."domain" = c."domain"
WHERE m."brandId" IS NULL AND m."competitorId" = c."id";

UPDATE "mentions" m
SET "brandId" = b."id"
FROM "prompt_responses" pr
JOIN "prompts" p ON p."id" = pr."promptId"
JOIN "brands" b ON b."businessId" = p."businessId" AND b."kind" = 'BUSINESS'
WHERE m."brandId" IS NULL AND m."promptResponseId" = pr."id" AND m."competitorId" IS NULL;

ALTER TABLE "mentions" ALTER COLUMN "brandId" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "mentions" DROP CONSTRAINT "mentions_competitorId_fkey";

-- DropIndex
DROP INDEX "mentions_competitorId_idx";

-- AlterTable
ALTER TABLE "mentions" DROP COLUMN "competitorId";

-- CreateIndex
CREATE INDEX "mentions_brandId_idx" ON "mentions"("brandId");

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "prompt_metrics" ADD COLUMN "brandId" UUID;

-- Backfill prompt_metrics.brandId via its existing, exact competitorId link
-- (bridged through domain since Brand has no competitorId column) or, when
-- competitorId was null, the prompt's own business's brand. Unlike mentions
-- above, this is an exact join — no fuzzy domain matching involved.
UPDATE "prompt_metrics" pm
SET "brandId" = b."id"
FROM "competitors" c
JOIN "brands" b ON b."businessId" = c."businessId" AND b."kind" = 'COMPETITOR' AND b."domain" = c."domain"
WHERE pm."competitorId" = c."id";

UPDATE "prompt_metrics" pm
SET "brandId" = b."id"
FROM "prompts" p
JOIN "brands" b ON b."businessId" = p."businessId" AND b."kind" = 'BUSINESS'
WHERE pm."competitorId" IS NULL AND pm."promptId" = p."id";

ALTER TABLE "prompt_metrics" ALTER COLUMN "brandId" SET NOT NULL;

-- DropIndex
DROP INDEX "prompt_metrics_promptId_competitorId_date_key";

-- DropForeignKey
ALTER TABLE "prompt_metrics" DROP CONSTRAINT "prompt_metrics_competitorId_fkey";

-- DropIndex
DROP INDEX "prompt_metrics_competitorId_idx";

-- AlterTable
ALTER TABLE "prompt_metrics" DROP COLUMN "competitorId";
ALTER TABLE "prompt_metrics" RENAME COLUMN "sov" TO "shareOfVoice";

-- CreateIndex
CREATE UNIQUE INDEX "prompt_metrics_promptId_brandId_date_key" ON "prompt_metrics"("promptId", "brandId", "date");

-- CreateIndex
CREATE INDEX "prompt_metrics_brandId_idx" ON "prompt_metrics"("brandId");

-- AddForeignKey
ALTER TABLE "prompt_metrics" ADD CONSTRAINT "prompt_metrics_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "business_metrics" ADD COLUMN "brandId" UUID;

-- Backfill business_metrics.brandId (same exact-join approach as
-- prompt_metrics above).
UPDATE "business_metrics" bm
SET "brandId" = b."id"
FROM "competitors" c
JOIN "brands" b ON b."businessId" = c."businessId" AND b."kind" = 'COMPETITOR' AND b."domain" = c."domain"
WHERE bm."competitorId" = c."id";

UPDATE "business_metrics" bm
SET "brandId" = b."id"
FROM "brands" b
WHERE bm."competitorId" IS NULL AND b."businessId" = bm."businessId" AND b."kind" = 'BUSINESS';

ALTER TABLE "business_metrics" ALTER COLUMN "brandId" SET NOT NULL;

-- The old aggregate-across-engines row used engine = null; it now uses the
-- ALL sentinel added above, so engine can become NOT NULL.
UPDATE "business_metrics" SET "engine" = 'ALL' WHERE "engine" IS NULL;

ALTER TABLE "business_metrics" ALTER COLUMN "engine" SET NOT NULL;

-- DropIndex
DROP INDEX "business_metrics_businessId_competitorId_date_engine_idx";

-- DropForeignKey
ALTER TABLE "business_metrics" DROP CONSTRAINT "business_metrics_competitorId_fkey";

-- DropIndex
DROP INDEX "business_metrics_competitorId_idx";

-- AlterTable
ALTER TABLE "business_metrics" DROP COLUMN "competitorId";
ALTER TABLE "business_metrics" RENAME COLUMN "sov" TO "shareOfVoice";

-- CreateIndex
-- Also the constraint that BusinessMetric was missing entirely before this
-- migration: nothing previously stopped duplicate rows for the same
-- (businessId, brandId, engine, date).
CREATE UNIQUE INDEX "business_metrics_businessId_brandId_engine_date_key" ON "business_metrics"("businessId", "brandId", "engine", "date");

-- CreateIndex
CREATE INDEX "business_metrics_brandId_idx" ON "business_metrics"("brandId");

-- AddForeignKey
ALTER TABLE "business_metrics" ADD CONSTRAINT "business_metrics_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropTable
-- Safe now: nothing references competitors.id anymore (mentions,
-- prompt_metrics, and business_metrics all moved to brandId above).
DROP TABLE "competitors";
