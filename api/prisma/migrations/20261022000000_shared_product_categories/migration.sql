BEGIN;

LOCK TABLE "product_categories", "category_sellers", "product_category_links"
  IN ACCESS EXCLUSIVE MODE;

-- Existing category IDs and assignments are retained. Duplicate handles require
-- deliberate reconciliation before categories can become globally unique.
DO $$
BEGIN
  IF EXISTS (
    SELECT "handle"
    FROM "product_categories"
    GROUP BY "handle"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot share product categories: duplicate handles exist across marketplaces. Reconcile those categories and their assignments before retrying this migration.';
  END IF;
END
$$;

DROP POLICY "tenant_isolation" ON "product_categories";

ALTER TABLE "category_sellers"
  DROP CONSTRAINT "category_sellers_marketplaceId_categoryId_fkey";
ALTER TABLE "product_category_links"
  DROP CONSTRAINT "product_category_links_marketplaceId_categoryId_fkey";
ALTER TABLE "product_categories"
  DROP CONSTRAINT "product_categories_marketplaceId_parentId_fkey",
  DROP CONSTRAINT "product_categories_marketplaceId_fkey";

DROP INDEX "product_categories_marketplaceId_parentId_idx";
DROP INDEX "product_categories_marketplaceId_id_key";
DROP INDEX "product_categories_marketplaceId_handle_key";

ALTER TABLE "product_categories" DROP COLUMN "marketplaceId";

CREATE UNIQUE INDEX "product_categories_handle_key"
  ON "product_categories" ("handle");
CREATE INDEX "product_categories_parentId_idx"
  ON "product_categories" ("parentId");

ALTER TABLE "product_categories"
  ADD CONSTRAINT "product_categories_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "product_categories" ("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "category_sellers"
  ADD CONSTRAINT "category_sellers_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "product_categories" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_category_links"
  ADD CONSTRAINT "product_category_links_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "product_categories" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Tenants can read the shared taxonomy; writes use the administrative connection.
-- The product and seller link tables retain their existing tenant isolation.
ALTER TABLE "product_categories" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON "product_categories" FROM cloviana_tenant;
GRANT SELECT ON "product_categories" TO cloviana_tenant;
CREATE POLICY "shared_categories_read" ON "product_categories"
  FOR SELECT TO cloviana_tenant USING (true);

COMMIT;
