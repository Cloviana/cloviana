-- CreateTable
CREATE TABLE "theme_versions" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "label" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "theme_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "theme_versions_marketplaceId_themeId_createdAt_idx" ON "theme_versions"("marketplaceId", "themeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "theme_versions_themeId_number_key" ON "theme_versions"("themeId", "number");

-- AddForeignKey
ALTER TABLE "theme_versions" ADD CONSTRAINT "theme_versions_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "themes"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tenant isolation
ALTER TABLE "theme_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_versions" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_versions" TO cloviana_tenant;
