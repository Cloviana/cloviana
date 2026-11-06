BEGIN;

LOCK TABLE "products" IN ACCESS EXCLUSIVE MODE;

CREATE TABLE "product_collection_links" (
  "marketplaceId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "collectionId" UUID NOT NULL,
  CONSTRAINT "product_collection_links_pkey" PRIMARY KEY ("marketplaceId", "productId", "collectionId"),
  CONSTRAINT "product_collection_links_marketplaceId_productId_fkey"
    FOREIGN KEY ("marketplaceId", "productId") REFERENCES "products"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "product_collection_links_marketplaceId_collectionId_fkey"
    FOREIGN KEY ("marketplaceId", "collectionId") REFERENCES "product_collections"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "product_collection_links_marketplaceId_collectionId_idx"
  ON "product_collection_links" ("marketplaceId", "collectionId");

INSERT INTO "product_collection_links" ("marketplaceId", "productId", "collectionId")
SELECT "marketplaceId", "id", "collectionId" FROM "products" WHERE "collectionId" IS NOT NULL;

ALTER TABLE "products" DROP CONSTRAINT "products_marketplaceId_collectionId_fkey";
ALTER TABLE "products" DROP COLUMN "collectionId";

ALTER TABLE "product_collection_links" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "product_collection_links"
  TO cloviana_tenant
  USING ("marketplaceId" = (SELECT public.current_marketplace_id()))
  WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "product_collection_links" TO cloviana_tenant;

COMMIT;
