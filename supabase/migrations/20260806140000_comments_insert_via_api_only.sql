-- Comments must go through /api/listings/comments (moderation + service role).
-- Drop client INSERT so RLS cannot bypass the API.

DROP POLICY IF EXISTS "comments_self_write" ON public.listing_comments;

REVOKE INSERT ON public.listing_comments FROM authenticated;
REVOKE INSERT ON public.listing_comments FROM anon;

-- service_role already has GRANT ALL (bypasses RLS) for the moderated API path.
