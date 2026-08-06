-- Public landing / featured sellers query active listings as anon.
-- RLS already allows status = 'active'; table GRANT was missing (unlike feed_rank).

GRANT SELECT ON public.listings TO anon;
