-- Rules Prisma cannot express, plus tenant isolation (Row Level Security).

-- Partial unique indexes -----------------------------------------------------
CREATE UNIQUE INDEX "offers_live_sku_key"
  ON "offers" ("marketplaceId", "sellerId", "sku")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "commission_rates_single_default_key"
  ON "commission_rates" ("marketplaceId")
  WHERE "isDefault";

-- CHECK constraints ----------------------------------------------------------
ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_target_matches_reference" CHECK (
    ("reference" = 'PRODUCT' AND "productId" IS NOT NULL AND "sellerId" IS NULL)
    OR ("reference" = 'SELLER' AND "sellerId" IS NOT NULL AND "productId" IS NULL)
  ),
  ADD CONSTRAINT "reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "commission_lines"
  ADD CONSTRAINT "commission_lines_single_target" CHECK (
    ("itemId" IS NOT NULL AND "shippingMethodId" IS NULL)
    OR ("itemId" IS NULL AND "shippingMethodId" IS NOT NULL)
  );

ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_quantities" CHECK (
    "stockedQuantity" >= 0
    AND "reservedQuantity" >= 0
    AND "reservedQuantity" <= "stockedQuantity"
  );

ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "offer_inventory_items"
  ADD CONSTRAINT "offer_inventory_items_quantity_positive" CHECK ("requiredQuantity" > 0);

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_non_negative" CHECK ("amount" >= 0);

ALTER TABLE "refunds"
  ADD CONSTRAINT "refunds_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "payouts"
  ADD CONSTRAINT "payouts_amount_non_negative" CHECK ("amount" >= 0);

-- Tenant isolation ------------------------------------------------------------
-- The API connects as a privileged role. Per request it opens a transaction and runs
--   SET LOCAL ROLE cloviana_tenant;  SELECT set_config('app.marketplace_id', <uuid>, true);
-- so every query below is filtered to one marketplace, even if application code forgets a WHERE.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cloviana_tenant') THEN
    CREATE ROLE cloviana_tenant NOLOGIN NOINHERIT NOBYPASSRLS;
  END IF;
END
$$;

GRANT cloviana_tenant TO CURRENT_USER;
GRANT USAGE ON SCHEMA public TO cloviana_tenant;

CREATE OR REPLACE FUNCTION public.current_marketplace_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.marketplace_id', true), '')::uuid
$$;

GRANT EXECUTE ON FUNCTION public.current_marketplace_id() TO cloviana_tenant;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND tb.table_type = 'BASE TABLE'
      AND c.column_name = 'marketplaceId'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', t);
    EXECUTE format(
      $policy$
        CREATE POLICY tenant_isolation ON public.%I
        TO cloviana_tenant
        USING ("marketplaceId" = (SELECT public.current_marketplace_id()))
        WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()))
      $policy$,
      t
    );
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO cloviana_tenant', t
    );
  END LOOP;
END
$$;

-- A tenant may read only its own marketplace row.
ALTER TABLE "marketplaces" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "marketplaces";
CREATE POLICY tenant_isolation ON "marketplaces"
  FOR SELECT TO cloviana_tenant
  USING ("id" = (SELECT public.current_marketplace_id()));
GRANT SELECT ON "marketplaces" TO cloviana_tenant;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO cloviana_tenant;

-- Guard: lists tenant tables that have no RLS. Run it in CI and after adding a table.
CREATE OR REPLACE FUNCTION public.tenant_tables_missing_rls()
RETURNS SETOF text
LANGUAGE sql
STABLE
AS $$
  SELECT c.table_name::text
  FROM information_schema.columns c
  JOIN pg_class pc ON pc.relname = c.table_name AND pc.relnamespace = 'public'::regnamespace
  WHERE c.table_schema = 'public'
    AND c.column_name = 'marketplaceId'
    AND NOT pc.relrowsecurity
$$;

DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(t, ', ') INTO missing FROM public.tenant_tables_missing_rls() t;
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Tables with marketplaceId but no RLS: %', missing;
  END IF;
END
$$;
