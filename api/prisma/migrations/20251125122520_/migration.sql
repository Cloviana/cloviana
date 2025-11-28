-- 1. Create the new Enum for Platform
CREATE TYPE "Platform" AS ENUM ('SHOPIFY', 'WOOCOMMERCE', 'BIGCOMMERCE', 'CUSTOM');

-- 2. Add Platform to Store (with default to keep existing stores working)
ALTER TABLE "stores" ADD COLUMN "platform" "Platform" NOT NULL DEFAULT 'SHOPIFY';

-- 3. PRODUCTS: Data Preservation & Migration
-- First, add the new metadata column
ALTER TABLE "products" ADD COLUMN "metadata" JSONB;

-- Migrate 'tags', 'category', and 'previewUrl' into the new metadata JSON field
-- so you don't lose this data even though we drop the columns.
UPDATE "products" 
SET "metadata" = jsonb_build_object(
    'migrated_tags', "tags", 
    'migrated_category', "category",
    'legacy_preview_url', "onlineStorePreviewUrl"
);

-- Drop the old unique indexes (Prisma will recreate them with new names later)
DROP INDEX IF EXISTS "public"."products_storeId_handle_key";
DROP INDEX IF EXISTS "public"."products_storeId_shopifyId_key";

-- RENAME columns instead of Dropping/Adding to preserve existing Sync data
ALTER TABLE "products" RENAME COLUMN "shopifyId" TO "externalId";
ALTER TABLE "products" RENAME COLUMN "handle" TO "slug";
ALTER TABLE "products" RENAME COLUMN "onlineStoreUrl" TO "url";

-- Now it is safe to drop the columns we migrated to metadata
ALTER TABLE "products" DROP COLUMN "category";
ALTER TABLE "products" DROP COLUMN "tags";
ALTER TABLE "products" DROP COLUMN "onlineStorePreviewUrl";

-- 4. BLOGS: Rename columns
ALTER TABLE "blogs" RENAME COLUMN "shopifyArticleId" TO "externalId";

-- 5. COLLECTIONS: Create new tables (Standard Prisma output)
CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "storeId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" CITEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "url" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- Create Join Tables for Relations
CREATE TABLE "_CollectionToProduct" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,
    CONSTRAINT "_CollectionToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE TABLE "_BlogToCollection" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,
    CONSTRAINT "_BlogToCollection_AB_pkey" PRIMARY KEY ("A","B")
);

-- 6. RECREATE INDICES (To match Prisma's naming conventions)
CREATE UNIQUE INDEX "collections_storeId_externalId_key" ON "collections"("storeId", "externalId");
CREATE UNIQUE INDEX "collections_storeId_slug_key" ON "collections"("storeId", "slug");

CREATE INDEX "_CollectionToProduct_B_index" ON "_CollectionToProduct"("B");
CREATE INDEX "_BlogToCollection_B_index" ON "_BlogToCollection"("B");

-- Recreate the indexes on products using the new column names
CREATE UNIQUE INDEX "products_storeId_externalId_key" ON "products"("storeId", "externalId");
CREATE UNIQUE INDEX "products_storeId_slug_key" ON "products"("storeId", "slug");

-- 7. ADD FOREIGN KEYS
ALTER TABLE "collections" ADD CONSTRAINT "collections_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_CollectionToProduct" ADD CONSTRAINT "_CollectionToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_CollectionToProduct" ADD CONSTRAINT "_CollectionToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_BlogToCollection" ADD CONSTRAINT "_BlogToCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_BlogToCollection" ADD CONSTRAINT "_BlogToCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;