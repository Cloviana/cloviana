ALTER TABLE "audits" ADD COLUMN "slug" TEXT;

WITH audit_slug_candidates AS (
  SELECT
    "id",
    lower(
      regexp_replace(
        regexp_replace(
          split_part(coalesce(nullif("brandName", ''), "domain"), '.', 1),
          '[^a-zA-Z0-9]+',
          '-',
          'g'
        ),
        '(^-|-$)',
        '',
        'g'
      )
    ) AS base_slug,
    row_number() OVER (
      PARTITION BY lower(
        regexp_replace(
          regexp_replace(
            split_part(coalesce(nullif("brandName", ''), "domain"), '.', 1),
            '[^a-zA-Z0-9]+',
            '-',
            'g'
          ),
          '(^-|-$)',
          '',
          'g'
        )
      )
      ORDER BY "createdAt", "id"
    ) AS duplicate_index
  FROM "audits"
)
UPDATE "audits"
SET "slug" = CASE
  WHEN audit_slug_candidates.base_slug = '' THEN 'audit-' || left("audits"."id"::text, 8)
  WHEN audit_slug_candidates.duplicate_index = 1 THEN audit_slug_candidates.base_slug
  ELSE audit_slug_candidates.base_slug || '-' || audit_slug_candidates.duplicate_index::text || '-' || left("audits"."id"::text, 8)
END
FROM audit_slug_candidates
WHERE "audits"."id" = audit_slug_candidates."id";

ALTER TABLE "audits" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "audits_slug_key" ON "audits"("slug");
