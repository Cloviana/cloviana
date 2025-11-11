CREATE EXTENSION IF NOT EXISTS citext;

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email" CITEXT, ADD COLUMN IF NOT EXISTS "contactEmail" CITEXT;

UPDATE "profiles" p
SET "email" = au.email
FROM auth.users au
WHERE p.id::uuid = au.id AND p."email" IS NULL;

UPDATE "profiles" p
SET "contactEmail" = COALESCE(au.raw_user_meta_data->>'contactEmail', au.email)
FROM auth.users au
WHERE p.id::uuid = au.id AND p."contactEmail" IS NULL;

ALTER TABLE "profiles" ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "profiles_email_key" ON "profiles"("email");

ALTER TABLE "stores" DROP COLUMN IF EXISTS "acceptedAt", DROP COLUMN IF EXISTS "betaUntil", DROP COLUMN IF EXISTS "stage";

CREATE OR REPLACE FUNCTION public.fn_profile_after_auth_insert() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."profiles" ("id","email","contactEmail","createdAt","updatedAt")
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'contactEmail', NEW.email), now(), now())
  ON CONFLICT ("id") DO UPDATE
  SET "email" = EXCLUDED."email", "updatedAt" = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_after_auth_insert ON auth.users;
CREATE TRIGGER trg_profile_after_auth_insert
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.fn_profile_after_auth_insert();

CREATE OR REPLACE FUNCTION public.fn_profile_after_auth_update() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_contact text := COALESCE(NEW.raw_user_meta_data->>'contactEmail', NULL);
BEGIN
  UPDATE public."profiles"
  SET
    "email" = NEW.email,
    "contactEmail" = COALESCE(new_contact, "contactEmail"),
    "updatedAt" = now()
  WHERE "id" = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_after_auth_update ON auth.users;
CREATE TRIGGER trg_profile_after_auth_update
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.fn_profile_after_auth_update();
