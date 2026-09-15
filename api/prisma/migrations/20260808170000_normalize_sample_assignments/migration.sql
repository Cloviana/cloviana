BEGIN;

CREATE UNIQUE INDEX "samples_id_brandKitId_key"
  ON "samples"("id", "brandKitId");

CREATE TABLE "sample_content_types" (
  "sampleId" UUID NOT NULL,
  "contentTypeId" UUID NOT NULL,
  "brandKitId" UUID NOT NULL,

  CONSTRAINT "sample_content_types_pkey" PRIMARY KEY ("sampleId", "contentTypeId")
);

CREATE TABLE "sample_audiences" (
  "sampleId" UUID NOT NULL,
  "audienceId" UUID NOT NULL,
  "brandKitId" UUID NOT NULL,

  CONSTRAINT "sample_audiences_pkey" PRIMARY KEY ("sampleId", "audienceId")
);

CREATE TABLE "sample_regions" (
  "sampleId" UUID NOT NULL,
  "regionId" UUID NOT NULL,
  "brandKitId" UUID NOT NULL,

  CONSTRAINT "sample_regions_pkey" PRIMARY KEY ("sampleId", "regionId")
);

INSERT INTO "sample_content_types" ("sampleId", "contentTypeId", "brandKitId")
SELECT "id", "contentTypeId", "brandKitId"
FROM "samples"
WHERE "contentTypeId" IS NOT NULL;

INSERT INTO "sample_audiences" ("sampleId", "audienceId", "brandKitId")
SELECT "id", "audienceId", "brandKitId"
FROM "samples"
WHERE "audienceId" IS NOT NULL;

INSERT INTO "sample_regions" ("sampleId", "regionId", "brandKitId")
SELECT "id", "regionId", "brandKitId"
FROM "samples"
WHERE "regionId" IS NOT NULL;

CREATE INDEX "sample_content_types_contentTypeId_brandKitId_idx"
  ON "sample_content_types"("contentTypeId", "brandKitId");
CREATE INDEX "sample_audiences_audienceId_brandKitId_idx"
  ON "sample_audiences"("audienceId", "brandKitId");
CREATE INDEX "sample_regions_regionId_brandKitId_idx"
  ON "sample_regions"("regionId", "brandKitId");

ALTER TABLE "sample_content_types"
  ADD CONSTRAINT "sample_content_types_sampleId_brandKitId_fkey"
    FOREIGN KEY ("sampleId", "brandKitId")
    REFERENCES "samples"("id", "brandKitId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sample_content_types_contentTypeId_brandKitId_fkey"
    FOREIGN KEY ("contentTypeId", "brandKitId")
    REFERENCES "content_types"("id", "brandKitId")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sample_audiences"
  ADD CONSTRAINT "sample_audiences_sampleId_brandKitId_fkey"
    FOREIGN KEY ("sampleId", "brandKitId")
    REFERENCES "samples"("id", "brandKitId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sample_audiences_audienceId_brandKitId_fkey"
    FOREIGN KEY ("audienceId", "brandKitId")
    REFERENCES "audiences"("id", "brandKitId")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sample_regions"
  ADD CONSTRAINT "sample_regions_sampleId_brandKitId_fkey"
    FOREIGN KEY ("sampleId", "brandKitId")
    REFERENCES "samples"("id", "brandKitId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sample_regions_regionId_brandKitId_fkey"
    FOREIGN KEY ("regionId", "brandKitId")
    REFERENCES "regions"("id", "brandKitId")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "samples"
  DROP CONSTRAINT "samples_contentTypeId_brandKitId_fkey",
  DROP CONSTRAINT "samples_audienceId_brandKitId_fkey",
  DROP CONSTRAINT "samples_regionId_brandKitId_fkey";

DROP INDEX "samples_brandKitId_scope_idx";
DROP INDEX "samples_contentTypeId_idx";
DROP INDEX "samples_audienceId_idx";
DROP INDEX "samples_regionId_idx";

ALTER TABLE "samples"
  DROP COLUMN "scope",
  DROP COLUMN "contentTypeId",
  DROP COLUMN "audienceId",
  DROP COLUMN "regionId";

CREATE INDEX "samples_brandKitId_idx" ON "samples"("brandKitId");

COMMIT;
