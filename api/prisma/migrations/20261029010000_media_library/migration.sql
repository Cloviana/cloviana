CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');
CREATE TABLE "media_assets" (
  "id" UUID NOT NULL,
  "marketplaceId" UUID NOT NULL,
  "storageKey" TEXT,
  "stagingPath" TEXT,
  "url" TEXT NOT NULL,
  "filename" TEXT,
  "sortName" TEXT,
  "type" "MediaType" NOT NULL,
  "mimeType" TEXT,
  "size" INTEGER,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "media_assets_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "media_assets_marketplaceId_id_key" ON "media_assets"("marketplaceId", "id");
CREATE UNIQUE INDEX "media_assets_marketplaceId_stagingPath_key" ON "media_assets"("marketplaceId", "stagingPath");
CREATE INDEX "media_assets_marketplaceId_createdAt_id_idx" ON "media_assets"("marketplaceId", "createdAt", "id");
CREATE INDEX "media_assets_marketplaceId_sortName_id_idx" ON "media_assets"("marketplaceId", "sortName", "id");
CREATE INDEX "media_assets_marketplaceId_size_id_idx" ON "media_assets"("marketplaceId", "size", "id");
CREATE EXTENSION IF NOT EXISTS pg_trgm;
DO $$
DECLARE extension_schema TEXT;
BEGIN
  SELECT n.nspname INTO extension_schema FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pg_trgm';
  EXECUTE format('CREATE INDEX "media_assets_filename_trgm_idx" ON "media_assets" USING GIN ("filename" %I.gin_trgm_ops)', extension_schema);
END
$$;
INSERT INTO "media_assets" ("id", "marketplaceId", "url", "type", "createdAt")
SELECT "id", "marketplaceId", "url", 'IMAGE'::"MediaType", "createdAt" FROM "product_images";
ALTER TABLE "product_images" ADD COLUMN "mediaAssetId" UUID;
UPDATE "product_images" SET "mediaAssetId" = "id";
ALTER TABLE "product_images" ALTER COLUMN "mediaAssetId" SET NOT NULL;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_marketplaceId_mediaAssetId_fkey" FOREIGN KEY ("marketplaceId", "mediaAssetId") REFERENCES "media_assets"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "product_images_marketplaceId_mediaAssetId_idx" ON "product_images"("marketplaceId", "mediaAssetId");
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "media_assets" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "media_assets" TO cloviana_tenant;
