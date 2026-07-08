-- Keep listing engagement counts in sync via triggers (buyers cannot UPDATE listings rows).

CREATE OR REPLACE FUNCTION public.bump_listing_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings SET like_count = like_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_listing_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings SET comment_count = comment_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_listing_save_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings SET save_count = save_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings SET save_count = GREATEST(0, save_count - 1) WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS listing_likes_count_trigger ON public.listing_likes;
CREATE TRIGGER listing_likes_count_trigger
  AFTER INSERT OR DELETE ON public.listing_likes
  FOR EACH ROW EXECUTE FUNCTION public.bump_listing_like_count();

DROP TRIGGER IF EXISTS listing_comments_count_trigger ON public.listing_comments;
CREATE TRIGGER listing_comments_count_trigger
  AFTER INSERT OR DELETE ON public.listing_comments
  FOR EACH ROW EXECUTE FUNCTION public.bump_listing_comment_count();

DROP TRIGGER IF EXISTS bookmarks_save_count_trigger ON public.bookmarks;
CREATE TRIGGER bookmarks_save_count_trigger
  AFTER INSERT OR DELETE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.bump_listing_save_count();
