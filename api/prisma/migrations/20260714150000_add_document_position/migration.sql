ALTER TABLE "documents"
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

WITH ranked_documents AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "businessId", "folderId"
            ORDER BY "createdAt" DESC, "id" DESC
        ) - 1 AS "position"
    FROM "documents"
)
UPDATE "documents" AS document
SET "position" = ranked."position"
FROM ranked_documents AS ranked
WHERE document."id" = ranked."id";

ALTER TABLE "documents"
ADD CONSTRAINT "documents_position_check" CHECK ("position" >= 0);

DROP INDEX "documents_businessId_folderId_createdAt_idx";

CREATE INDEX "documents_businessId_folderId_position_idx"
ON "documents"("businessId", "folderId", "position");
