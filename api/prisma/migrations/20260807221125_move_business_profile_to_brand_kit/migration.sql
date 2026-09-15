-- Ensure every business has its own brand before removing the duplicated
-- identity columns. The earlier brand migration already created these rows;
-- this makes the migration safe for any database that missed that backfill.
INSERT INTO "brands" (
    "id",
    "businessId",
    "kind",
    "domain",
    "name",
    "aliases",
    "createdAt",
    "updatedAt"
)
SELECT
    uuid_generate_v4(),
    business."id",
    'BUSINESS',
    business."domain",
    business."name",
    ARRAY[]::TEXT[],
    business."createdAt",
    business."updatedAt"
FROM "businesses" business
WHERE NOT EXISTS (
    SELECT 1
    FROM "brands" brand
    WHERE brand."businessId" = business."id"
      AND brand."kind" = 'BUSINESS'
)
ON CONFLICT ("businessId", "domain") DO NOTHING;

-- Abort before dropping the old values if the business-brand invariant is
-- not satisfied. Application reads require exactly one BUSINESS brand.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "businesses" business
        LEFT JOIN "brands" brand
          ON brand."businessId" = business."id"
         AND brand."kind" = 'BUSINESS'
        GROUP BY business."id"
        HAVING COUNT(brand."id") <> 1
    ) THEN
        RAISE EXCEPTION 'Every business must have exactly one BUSINESS brand';
    END IF;
END $$;

-- Brand Kit owns the descriptive profile. Preserve the existing business
-- description, creating a kit where one does not exist yet.
INSERT INTO "brand_kits" (
    "id",
    "businessId",
    "about",
    "draftRevision",
    "createdAt",
    "updatedAt"
)
SELECT
    uuid_generate_v4(),
    business."id",
    NULLIF(BTRIM(business."description"), ''),
    0,
    business."createdAt",
    business."updatedAt"
FROM "businesses" business
ON CONFLICT ("businessId") DO NOTHING;

UPDATE "brand_kits" brand_kit
SET
    "about" = NULLIF(BTRIM(business."description"), ''),
    "updatedAt" = CURRENT_TIMESTAMP
FROM "businesses" business
WHERE brand_kit."businessId" = business."id"
  AND (brand_kit."about" IS NULL OR BTRIM(brand_kit."about") = '')
  AND BTRIM(business."description") <> '';

-- Personas are represented by Brand Kit audiences in the new schema.
INSERT INTO "audiences" (
    "id",
    "brandKitId",
    "name",
    "description",
    "createdAt",
    "updatedAt"
)
SELECT
    uuid_generate_v4(),
    brand_kit."id",
    BTRIM(persona.value),
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "businesses" business
JOIN "brand_kits" brand_kit ON brand_kit."businessId" = business."id"
CROSS JOIN LATERAL UNNEST(business."personas") AS persona(value)
WHERE BTRIM(persona.value) <> ''
ON CONFLICT ("brandKitId", "name") DO NOTHING;

ALTER TABLE "businesses"
    DROP COLUMN "name",
    DROP COLUMN "domain",
    DROP COLUMN "category",
    DROP COLUMN "description",
    DROP COLUMN "personas";
