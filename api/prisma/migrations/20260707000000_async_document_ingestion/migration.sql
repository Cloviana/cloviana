CREATE TYPE "DocumentStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED');

ALTER TABLE "documents"
ADD COLUMN "filename" TEXT,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "filePath" TEXT,
ADD COLUMN "status" "DocumentStatus" NOT NULL DEFAULT 'READY',
ADD COLUMN "failureReason" TEXT,
ADD COLUMN "indexedAt" TIMESTAMP(3);

UPDATE "documents"
SET "indexedAt" = "updatedAt"
WHERE "indexedAt" IS NULL;

ALTER TABLE "documents" ALTER COLUMN "status" SET DEFAULT 'PROCESSING';

DROP INDEX IF EXISTS "documents_businessId_idx";
CREATE INDEX "documents_businessId_status_idx" ON "documents"("businessId", "status");

DROP TABLE IF EXISTS "cms_pages";
DROP TABLE IF EXISTS "cms_connections";
DROP TYPE IF EXISTS "CmsPlatform";
