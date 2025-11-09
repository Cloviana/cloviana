ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name='auth')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='auth' AND table_name='users') THEN
    UPDATE public.profiles p
    SET email = COALESCE(u.raw_user_meta_data->>'contact_email', u.email)
    FROM auth.users u
    WHERE p.id = u.id;
  END IF;
END $$;

ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = COALESCE(NEW.raw_user_meta_data->>'contact_email', NEW.email),
      "updatedAt" = now()
  WHERE id = NEW.id;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_change ON auth.users;

CREATE TRIGGER on_auth_user_email_change
AFTER INSERT OR UPDATE OF email, raw_user_meta_data
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_email();
