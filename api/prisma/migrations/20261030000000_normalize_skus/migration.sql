-- Refuse to invent replacements if existing values collide after normalization.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "product_variants"
    WHERE NULLIF(btrim("sku"), '') IS NOT NULL
    GROUP BY "marketplaceId", upper(btrim("sku")) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot normalize variant SKUs: duplicates exist within a marketplace';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "offers" WHERE "deletedAt" IS NULL
    GROUP BY "marketplaceId", "sellerId", upper(btrim("sku")) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot normalize seller SKUs: duplicates exist for a seller';
  END IF;
END
$$;

UPDATE "product_variants" SET "sku" = NULLIF(upper(btrim("sku")), '') WHERE "sku" IS NOT NULL;
UPDATE "inventory_items" SET "sku" = NULLIF(upper(btrim("sku")), '') WHERE "sku" IS NOT NULL;
UPDATE "offers" SET "sku" = upper(btrim("sku"));
UPDATE "order_items" SET "sku" = upper("sku");

-- Deferral permits two variants to exchange SKUs in one product update.
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_marketplaceId_sku_key"
  UNIQUE ("marketplaceId", "sku") DEFERRABLE INITIALLY DEFERRED;

CREATE FUNCTION normalize_live_sku() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."sku" := upper(btrim(NEW."sku"));
  IF TG_TABLE_NAME IN ('product_variants', 'inventory_items') THEN
    NEW."sku" := NULLIF(NEW."sku", '');
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER product_variants_normalize_sku BEFORE INSERT OR UPDATE OF "sku" ON "product_variants"
  FOR EACH ROW EXECUTE FUNCTION normalize_live_sku();
CREATE TRIGGER inventory_items_normalize_sku BEFORE INSERT OR UPDATE OF "sku" ON "inventory_items"
  FOR EACH ROW EXECUTE FUNCTION normalize_live_sku();
CREATE TRIGGER offers_normalize_sku BEFORE INSERT OR UPDATE OF "sku" ON "offers"
  FOR EACH ROW EXECUTE FUNCTION normalize_live_sku();
CREATE TRIGGER order_items_normalize_sku BEFORE INSERT OR UPDATE OF "sku" ON "order_items"
  FOR EACH ROW EXECUTE FUNCTION normalize_live_sku();
