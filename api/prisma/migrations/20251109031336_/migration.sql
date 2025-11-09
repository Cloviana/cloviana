ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

INSERT INTO public.profiles (id, email, "createdAt", "updatedAt")
SELECT u.id, COALESCE(u.raw_user_meta_data->>'contact_email', u.email), now(), now()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

UPDATE public.profiles p
SET email = COALESCE(u.raw_user_meta_data->>'contact_email', u.email), "updatedAt" = now()
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;

ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;

ALTER TABLE "stores"
DROP COLUMN IF EXISTS "acceptedAt",
DROP COLUMN IF EXISTS "betaUntil",
DROP COLUMN IF EXISTS "stage";

CREATE OR REPLACE FUNCTION public.create_profile_on_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, "createdAt", "updatedAt")
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'contact_email', NEW.email), now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS on_auth_user_insert_create_profile ON auth.users;

CREATE TRIGGER on_auth_user_insert_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_on_auth_user();
