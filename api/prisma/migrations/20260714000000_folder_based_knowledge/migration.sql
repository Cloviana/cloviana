CREATE TYPE "DocumentStatus_new" AS ENUM (
    'PENDING',
    'PROCESSING',
    'READY',
    'FAILED'
);

ALTER TABLE "documents" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "documents"
ALTER COLUMN "status" TYPE "DocumentStatus_new"
USING ("status"::TEXT::"DocumentStatus_new");

DROP TYPE "DocumentStatus";
ALTER TYPE "DocumentStatus_new" RENAME TO "DocumentStatus";

CREATE TABLE "folders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "businessId" TEXT NOT NULL,
    "parentId" UUID,
    "name" CITEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "folders_position_check" CHECK ("position" >= 0),
    CONSTRAINT "folders_name_check" CHECK (
        char_length(btrim("name"::TEXT)) BETWEEN 1 AND 100
    )
);

CREATE UNIQUE INDEX "folders_id_businessId_key"
ON "folders"("id", "businessId");

CREATE UNIQUE INDEX "folders_businessId_parentId_name_key"
ON "folders"("businessId", "parentId", "name");

CREATE UNIQUE INDEX "folders_businessId_root_name_key"
ON "folders"("businessId", "name")
WHERE "parentId" IS NULL;

CREATE UNIQUE INDEX "folders_businessId_default_key"
ON "folders"("businessId")
WHERE "isDefault" = true;

CREATE INDEX "folders_businessId_parentId_position_idx"
ON "folders"("businessId", "parentId", "position");

ALTER TABLE "folders"
ADD CONSTRAINT "folders_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "folders"
ADD CONSTRAINT "folders_parentId_businessId_fkey"
FOREIGN KEY ("parentId", "businessId") REFERENCES "folders"("id", "businessId")
ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "folders" (
    "id",
    "businessId",
    "name",
    "position",
    "isDefault",
    "updatedAt"
)
SELECT
    uuid_generate_v4(),
    "id",
    'Default',
    0,
    true,
    CURRENT_TIMESTAMP
FROM "businesses";

ALTER TABLE "documents"
ADD COLUMN "folderId" UUID,
ADD COLUMN "sizeBytes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "chunkCount" INTEGER,
ADD COLUMN "ingestionAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "ingestionQueuedAt" TIMESTAMP(3),
ADD COLUMN "ingestionStartedAt" TIMESTAMP(3);

UPDATE "documents" AS document
SET "folderId" = folder."id"
FROM "folders" AS folder
WHERE folder."businessId" = document."businessId"
  AND folder."isDefault" = true;

ALTER TABLE "documents" ALTER COLUMN "folderId" SET NOT NULL;
ALTER TABLE "documents" ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "documents"
ADD CONSTRAINT "documents_sizeBytes_check" CHECK ("sizeBytes" >= 0),
ADD CONSTRAINT "documents_chunkCount_check" CHECK (
    "chunkCount" IS NULL OR "chunkCount" >= 0
),
ADD CONSTRAINT "documents_ingestionAttempts_check" CHECK (
    "ingestionAttempts" >= 0
);

UPDATE "documents"
SET
    "status" = 'PENDING',
    "failureReason" = NULL,
    "indexedAt" = NULL
WHERE "filePath" IS NOT NULL;

UPDATE "documents"
SET
    "status" = 'FAILED',
    "failureReason" = 'Re-upload required because the original source file is unavailable.',
    "indexedAt" = NULL
WHERE "filePath" IS NULL;

ALTER TABLE "documents" DROP COLUMN "tag";
DROP TYPE "DocumentTag";

CREATE INDEX "documents_businessId_folderId_createdAt_idx"
ON "documents"("businessId", "folderId", "createdAt");

CREATE INDEX "documents_status_ingestionQueuedAt_createdAt_idx"
ON "documents"("status", "ingestionQueuedAt", "createdAt");

CREATE INDEX "documents_status_ingestionStartedAt_idx"
ON "documents"("status", "ingestionStartedAt");

ALTER TABLE "documents"
ADD CONSTRAINT "documents_folderId_businessId_fkey"
FOREIGN KEY ("folderId", "businessId") REFERENCES "folders"("id", "businessId")
ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TABLE IF EXISTS "blog_drafts";
DROP TYPE IF EXISTS "BlogDraftStatus";
