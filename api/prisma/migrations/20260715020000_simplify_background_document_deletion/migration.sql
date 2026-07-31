DROP INDEX "documents_deletedAt_deletionQueuedAt_createdAt_idx";
DROP INDEX "documents_deletedAt_deletionStartedAt_idx";

ALTER TABLE "documents"
DROP COLUMN "deletionQueuedAt",
DROP COLUMN "deletionStartedAt";

CREATE INDEX "documents_deletedAt_createdAt_idx"
ON "documents"("deletedAt", "createdAt");
