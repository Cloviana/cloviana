-- Store a stable lookup key without replacing the original cited URL.
ALTER TABLE "citations"
ADD COLUMN "canonicalUrl" TEXT;

-- Existing rows retain their original URL as the initial lookup key. New rows
-- are canonicalized by the monitoring workflow before they are persisted.
UPDATE "citations"
SET "canonicalUrl" = "url";

ALTER TABLE "citations"
ALTER COLUMN "canonicalUrl" SET NOT NULL;

CREATE INDEX "citations_canonicalUrl_createdAt_idx"
ON "citations"("canonicalUrl", "createdAt" DESC);

CREATE INDEX "citations_domain_createdAt_idx"
ON "citations"("domain", "createdAt" DESC);
