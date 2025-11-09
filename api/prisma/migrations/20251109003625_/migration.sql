ALTER TABLE "profiles" ADD COLUMN "email" TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name='auth')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='auth' AND table_name='users') THEN
    EXECUTE 'UPDATE "public"."profiles" p SET "email" = u."email" FROM "auth"."users" u WHERE p."id" = u."id";';
  END IF;
END $$;

ALTER TABLE "profiles" ALTER COLUMN "email" SET NOT NULL;

ALTER TABLE "stores"
DROP COLUMN "acceptedAt",
DROP COLUMN "betaUntil",
DROP COLUMN "stage";
