-- TikTok-style social: public follow reads, unique usernames, follower counts

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS follower_count INT NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Backfill usernames from slug (drop trailing -uuid8) or display_name
UPDATE public.profiles
SET username = lower(
  regexp_replace(
    COALESCE(
      NULLIF(regexp_replace(slug, '-[0-9a-f]{8}$', ''), ''),
      regexp_replace(display_name, '[^a-zA-Z0-9]', '', 'g')
    ),
    '[^a-z0-9_]', '', 'g'
  )
) || substr(id::text, 1, 4)
WHERE username IS NULL
  AND display_name IS NOT NULL
  AND length(regexp_replace(COALESCE(display_name, ''), '[^a-zA-Z0-9]', '', 'g')) >= 2;

-- Anyone can read follows (for counts + follower/following lists)
CREATE POLICY "follows_public_read" ON public.follows FOR SELECT USING (true);
GRANT SELECT ON public.follows TO anon;

CREATE OR REPLACE FUNCTION public.sync_follower_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  slug_key TEXT;
BEGIN
  slug_key := lower(COALESCE(NEW.farmer_slug, OLD.farmer_slug));
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET follower_count = follower_count + 1
    WHERE lower(slug) = slug_key OR lower(username) = slug_key;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET follower_count = GREATEST(0, follower_count - 1)
    WHERE lower(slug) = slug_key OR lower(username) = slug_key;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS follows_count_sync ON public.follows;
CREATE TRIGGER follows_count_sync
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.sync_follower_count();

UPDATE public.profiles p
SET follower_count = COALESCE((
  SELECT COUNT(*)::int FROM public.follows f WHERE lower(f.farmer_slug) = lower(p.slug)
), 0);
