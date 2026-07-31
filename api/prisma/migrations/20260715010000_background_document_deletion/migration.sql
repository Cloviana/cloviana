ALTER TABLE "documents"
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletionQueuedAt" TIMESTAMP(3),
ADD COLUMN "deletionStartedAt" TIMESTAMP(3);

CREATE INDEX "documents_deletedAt_deletionQueuedAt_createdAt_idx"
ON "documents"("deletedAt", "deletionQueuedAt", "createdAt");

CREATE INDEX "documents_deletedAt_deletionStartedAt_idx"
ON "documents"("deletedAt", "deletionStartedAt");
