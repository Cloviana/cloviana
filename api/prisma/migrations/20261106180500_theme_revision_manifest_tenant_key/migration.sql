-- Tenant-scoped key backing the composite relation to theme_revisions.
DROP INDEX "theme_revision_manifests_marketplaceId_idx";
CREATE UNIQUE INDEX "theme_revision_manifests_marketplaceId_revisionId_key" ON "theme_revision_manifests"("marketplaceId", "revisionId");
