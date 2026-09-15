BEGIN;

ALTER TABLE "samples" ADD COLUMN "contentTypeId" UUID;

UPDATE "samples" s
SET "contentTypeId" = sub."contentTypeId"
FROM (
  SELECT DISTINCT ON ("sampleId") "sampleId", "contentTypeId"
  FROM "sample_content_types"
  ORDER BY "sampleId", "contentTypeId"
) sub
WHERE sub."sampleId" = s."id";

-- Samples that were never linked to a content type have no valid owner
-- under the new required relationship; drop them (cascades to their
-- sample_audiences/sample_regions rows via existing FKs).
DELETE FROM "samples" WHERE "contentTypeId" IS NULL;

ALTER TABLE "samples" ALTER COLUMN "contentTypeId" SET NOT NULL;

CREATE INDEX "samples_contentTypeId_brandKitId_idx"
  ON "samples"("contentTypeId", "brandKitId");

ALTER TABLE "samples"
  ADD CONSTRAINT "samples_contentTypeId_brandKitId_fkey"
    FOREIGN KEY ("contentTypeId", "brandKitId")
    REFERENCES "content_types"("id", "brandKitId")
    ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "sample_content_types";

COMMIT;
