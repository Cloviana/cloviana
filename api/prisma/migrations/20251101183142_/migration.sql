/*
  Migration: convert explicit blog_products join to implicit many-to-many (_BlogToProduct)
*/

BEGIN;

-- Create new implicit join table
CREATE TABLE IF NOT EXISTS "_BlogToProduct" (
  "A" UUID NOT NULL,
  "B" UUID NOT NULL,
  CONSTRAINT "_BlogToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX IF NOT EXISTS "_BlogToProduct_B_index" ON "_BlogToProduct"("B");

ALTER TABLE "_BlogToProduct"
  ADD CONSTRAINT "_BlogToProduct_A_fkey"
  FOREIGN KEY ("A") REFERENCES "blogs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_BlogToProduct"
  ADD CONSTRAINT "_BlogToProduct_B_fkey"
  FOREIGN KEY ("B") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill data from existing blog_products and productId column (if still exists)
INSERT INTO "_BlogToProduct" ("A","B")
SELECT "id","productId"
FROM "blogs"
WHERE "productId" IS NOT NULL
ON CONFLICT ("A","B") DO NOTHING;

INSERT INTO "_BlogToProduct" ("A","B")
SELECT "blogId","productId"
FROM "blog_products"
ON CONFLICT ("A","B") DO NOTHING;

-- Clean up legacy schema
ALTER TABLE "blogs" DROP COLUMN IF EXISTS "productId";
DROP TABLE IF EXISTS "blog_products";

COMMIT;
