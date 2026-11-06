-- Read model for the code view: which files each revision holds.
CREATE TABLE "theme_revision_manifests" (
    "revisionId" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "files" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "theme_revision_manifests_pkey" PRIMARY KEY ("revisionId")
);

CREATE INDEX "theme_revision_manifests_marketplaceId_idx" ON "theme_revision_manifests"("marketplaceId");

ALTER TABLE "theme_revision_manifests" ADD CONSTRAINT "theme_revision_manifests_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "theme_revision_manifests" ADD CONSTRAINT "theme_revision_manifests_marketplaceId_revisionId_fkey" FOREIGN KEY ("marketplaceId", "revisionId") REFERENCES "theme_revisions"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "theme_revision_manifests" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_revision_manifests" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_revision_manifests" TO cloviana_tenant;
