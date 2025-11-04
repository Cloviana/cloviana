BEGIN;

CREATE TABLE "public"."blog_products" (
  "blogId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  CONSTRAINT "blog_products_pkey" PRIMARY KEY ("blogId","productId")
);

CREATE INDEX "blog_products_productId_blogId_idx"
  ON "public"."blog_products"("productId","blogId");

ALTER TABLE "public"."blog_products"
  ADD CONSTRAINT "blog_products_blogId_fkey"
  FOREIGN KEY ("blogId") REFERENCES "public"."blogs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."blog_products"
  ADD CONSTRAINT "blog_products_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "public"."products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "public"."blog_products" ("blogId","productId")
SELECT "id","productId"
FROM "public"."blogs"
WHERE "productId" IS NOT NULL;

ALTER TABLE "public"."blogs" DROP CONSTRAINT IF EXISTS "blogs_productId_fkey";
ALTER TABLE "public"."blogs" DROP COLUMN "productId";

COMMIT;
