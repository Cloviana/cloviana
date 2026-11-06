-- CreateEnum
CREATE TYPE "ThemeStatus" AS ENUM ('DRAFT', 'LIVE');

-- CreateEnum
CREATE TYPE "ThemeResource" AS ENUM ('PRODUCT', 'CATEGORY', 'SELLER');

-- CreateEnum
CREATE TYPE "ThemeComponentKind" AS ENUM ('VISUAL', 'CODE');

-- CreateTable
CREATE TABLE "themes" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ThemeStatus" NOT NULL DEFAULT 'DRAFT',
    "settings" JSONB NOT NULL,
    "thumbnailId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_pages" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "resource" "ThemeResource",
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "content" JSONB NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "socialImageId" UUID,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_components" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ThemeComponentKind" NOT NULL,
    "content" JSONB,
    "source" TEXT,
    "propSchema" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "themes_marketplaceId_status_idx" ON "themes"("marketplaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "themes_marketplaceId_id_key" ON "themes"("marketplaceId", "id");

-- CreateIndex
CREATE INDEX "theme_pages_marketplaceId_themeId_idx" ON "theme_pages"("marketplaceId", "themeId");

-- CreateIndex
CREATE UNIQUE INDEX "theme_pages_themeId_path_key" ON "theme_pages"("themeId", "path");

-- CreateIndex
CREATE INDEX "theme_components_marketplaceId_themeId_idx" ON "theme_components"("marketplaceId", "themeId");

-- CreateIndex
CREATE UNIQUE INDEX "theme_components_themeId_name_key" ON "theme_components"("themeId", "name");

-- AddForeignKey
ALTER TABLE "themes" ADD CONSTRAINT "themes_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_pages" ADD CONSTRAINT "theme_pages_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "themes"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_components" ADD CONSTRAINT "theme_components_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "themes"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Only one LIVE theme per marketplace
CREATE UNIQUE INDEX "themes_single_live_key" ON "themes" ("marketplaceId") WHERE "status" = 'LIVE';

-- Tenant isolation
ALTER TABLE "themes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "themes" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "themes" TO cloviana_tenant;

ALTER TABLE "theme_pages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_pages" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_pages" TO cloviana_tenant;

ALTER TABLE "theme_components" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_components" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_components" TO cloviana_tenant;
