CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public."profiles"
  ADD COLUMN IF NOT EXISTS "email" CITEXT;

UPDATE public."profiles" p
SET "email" = au.email
FROM auth.users au
WHERE p.id::uuid = au.id
  AND p."email" IS NULL;

ALTER TABLE public."profiles"
  ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "profiles_email_key"
  ON public."profiles" ("email");

CREATE OR REPLACE FUNCTION public.fn_profile_after_auth_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."profiles" ("id", "email", "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.email,
    now(),
    now()
  )
  ON CONFLICT ("id") DO UPDATE
    SET
      "email" = EXCLUDED."email",
      "updatedAt" = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_after_auth_insert ON auth.users;

CREATE TRIGGER trg_profile_after_auth_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.fn_profile_after_auth_insert();

CREATE OR REPLACE FUNCTION public.fn_profile_after_auth_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public."profiles"
  SET
    "email" = NEW.email,
    "updatedAt" = now()
  WHERE "id" = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_after_auth_update ON auth.users;

CREATE TRIGGER trg_profile_after_auth_update
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.fn_profile_after_auth_update();