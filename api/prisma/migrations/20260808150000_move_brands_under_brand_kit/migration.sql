BEGIN;

-- Move the business ownership boundary to Brand Kit. Every existing brand is
-- attached to the kit that currently belongs to its business.
ALTER TABLE "brand_kits" ADD COLUMN "businessId" TEXT;
UPDATE "brand_kits" bk
SET "businessId" = b."businessId"
FROM "brands" b
WHERE b."id" = bk."brandId";

ALTER TABLE "brands" ADD COLUMN "brandKitId" UUID;
UPDATE "brands" b
SET "brandKitId" = bk."id"
FROM "brand_kits" bk
WHERE bk."businessId" = b."businessId";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "brand_kits" WHERE "businessId" IS NULL) THEN
    RAISE EXCEPTION 'A brand kit could not be matched to its business';
  END IF;

  IF EXISTS (
    SELECT business."id"
    FROM "businesses" business
    LEFT JOIN "brand_kits" bk ON bk."businessId" = business."id"
    GROUP BY business."id"
    HAVING COUNT(bk."id") <> 1
  ) THEN
    RAISE EXCEPTION 'Every business must have exactly one brand kit';
  END IF;

  IF EXISTS (SELECT 1 FROM "brands" WHERE "brandKitId" IS NULL) THEN
    RAISE EXCEPTION 'A brand could not be matched to its business brand kit';
  END IF;

  IF EXISTS (
    SELECT bk."id"
    FROM "brand_kits" bk
    LEFT JOIN "brands" b
      ON b."brandKitId" = bk."id" AND b."kind" = 'BUSINESS'
    GROUP BY bk."id"
    HAVING COUNT(b."id") <> 1
  ) THEN
    RAISE EXCEPTION 'Every brand kit must have exactly one BUSINESS brand';
  END IF;
END
$$;

ALTER TABLE "brand_kits" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "brands" ALTER COLUMN "brandKitId" SET NOT NULL;

-- Metrics still belong to a business, but their brand now reaches that
-- business through Brand Kit instead of a duplicated Brand.businessId.
ALTER TABLE "prompt_metrics"
  DROP CONSTRAINT "prompt_metrics_brandId_businessId_fkey";
ALTER TABLE "business_metrics"
  DROP CONSTRAINT "business_metrics_brandId_businessId_fkey";

ALTER TABLE "brand_kits"
  DROP CONSTRAINT "brand_kits_brandId_fkey";
ALTER TABLE "brands"
  DROP CONSTRAINT "brands_businessId_fkey";

DROP INDEX "brand_kits_brandId_key";
DROP INDEX "brands_id_businessId_key";
DROP INDEX "brands_one_business_brand_per_business_key";

ALTER TABLE "brand_kits" DROP COLUMN "brandId";
ALTER TABLE "brands" DROP COLUMN "businessId";

CREATE UNIQUE INDEX "brand_kits_businessId_key"
  ON "brand_kits"("businessId");
CREATE INDEX "brands_brandKitId_idx"
  ON "brands"("brandKitId");
CREATE UNIQUE INDEX "brands_one_business_brand_per_brand_kit_key"
  ON "brands"("brandKitId") WHERE "kind" = 'BUSINESS';

ALTER TABLE "brand_kits"
  ADD CONSTRAINT "brand_kits_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brands"
  ADD CONSTRAINT "brands_brandKitId_fkey"
    FOREIGN KEY ("brandKitId") REFERENCES "brand_kits"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prompt_metrics"
  ADD CONSTRAINT "prompt_metrics_brandId_fkey"
    FOREIGN KEY ("brandId") REFERENCES "brands"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_metrics"
  ADD CONSTRAINT "business_metrics_brandId_fkey"
    FOREIGN KEY ("brandId") REFERENCES "brands"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
