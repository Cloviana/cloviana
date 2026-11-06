BEGIN;

LOCK TABLE "product_categories", "category_sellers", "product_category_links", "commission_rules"
  IN ACCESS EXCLUSIVE MODE;

DROP POLICY "shared_categories_read" ON "product_categories";

ALTER TABLE "category_sellers"
  DROP CONSTRAINT "category_sellers_categoryId_fkey";
ALTER TABLE "product_category_links"
  DROP CONSTRAINT "product_category_links_categoryId_fkey";
ALTER TABLE "product_categories"
  DROP CONSTRAINT "product_categories_parentId_fkey";

-- Start with empty marketplace-owned trees. Products, sellers and commission
-- rates remain intact; category references must be cleared before the taxonomy.
DELETE FROM "product_category_links";
DELETE FROM "category_sellers";
DELETE FROM "commission_rules" WHERE "reference" = 'CATEGORY';
DELETE FROM "product_categories";

DROP INDEX "product_categories_handle_key";
DROP INDEX "product_categories_parentId_idx";

ALTER TABLE "product_categories" ADD COLUMN "marketplaceId" UUID NOT NULL;

CREATE UNIQUE INDEX "product_categories_marketplaceId_id_key"
  ON "product_categories" ("marketplaceId", "id");
CREATE UNIQUE INDEX "product_categories_marketplaceId_handle_key"
  ON "product_categories" ("marketplaceId", "handle");
CREATE INDEX "product_categories_marketplaceId_parentId_idx"
  ON "product_categories" ("marketplaceId", "parentId");

ALTER TABLE "product_categories"
  ADD CONSTRAINT "product_categories_marketplaceId_fkey"
  FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces" ("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "product_categories_marketplaceId_parentId_fkey"
  FOREIGN KEY ("marketplaceId", "parentId") REFERENCES "product_categories" ("marketplaceId", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "category_sellers"
  ADD CONSTRAINT "category_sellers_marketplaceId_categoryId_fkey"
  FOREIGN KEY ("marketplaceId", "categoryId") REFERENCES "product_categories" ("marketplaceId", "id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_category_links"
  ADD CONSTRAINT "product_category_links_marketplaceId_categoryId_fkey"
  FOREIGN KEY ("marketplaceId", "categoryId") REFERENCES "product_categories" ("marketplaceId", "id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "product_categories"
  TO cloviana_tenant
  USING ("marketplaceId" = (SELECT public.current_marketplace_id()))
  WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "product_categories" TO cloviana_tenant;

COMMIT;
