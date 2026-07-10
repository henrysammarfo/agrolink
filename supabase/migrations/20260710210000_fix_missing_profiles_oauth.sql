-- Harden signup profile creation for Google OAuth (picture/name fields) and backfill orphans.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
BEGIN
  base_username := lower(regexp_replace(split_part(COALESCE(NEW.email, 'user'), '@', 1), '[^a-z0-9]', '', 'g'))
    || substr(NEW.id::text, 1, 4);

  INSERT INTO public.profiles (id, display_name, avatar_url, username, region)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    base_username,
    'Greater Accra'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'buyer'::public.app_role)
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill auth users missing profiles (e.g. designtest789@gmail.com)
INSERT INTO public.profiles (id, display_name, avatar_url, username, region)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ) AS display_name,
  COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture'
  ) AS avatar_url,
  lower(regexp_replace(split_part(COALESCE(u.email, 'user'), '@', 1), '[^a-z0-9]', '', 'g'))
    || substr(u.id::text, 1, 4) AS username,
  'Greater Accra'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
