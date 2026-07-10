-- Reset inflated seed engagement counts to real values from interaction tables.

UPDATE public.listings l
SET
  like_count = COALESCE((
    SELECT COUNT(*)::int FROM public.listing_likes ll WHERE ll.listing_id = l.id
  ), 0),
  comment_count = COALESCE((
    SELECT COUNT(*)::int FROM public.listing_comments lc WHERE lc.listing_id = l.id
  ), 0),
  save_count = COALESCE((
    SELECT COUNT(*)::int FROM public.bookmarks b WHERE b.listing_id = l.id
  ), 0);
