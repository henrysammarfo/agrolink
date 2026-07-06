-- service_role needs table-level GRANTs (bypasses RLS but not privileges)
GRANT ALL ON public.listings TO service_role;
GRANT ALL ON public.listing_likes TO service_role;
GRANT ALL ON public.listing_comments TO service_role;
GRANT ALL ON public.listing_reports TO service_role;
GRANT ALL ON public.carts TO service_role;
GRANT ALL ON public.cart_items TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.driver_profiles TO service_role;
GRANT ALL ON public.deliveries TO service_role;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.market_prices TO service_role;
GRANT ALL ON public.ai_analysis TO service_role;
GRANT ALL ON public.audit_log TO service_role;
GRANT ALL ON public.driver_documents TO service_role;
GRANT ALL ON public.disputes TO service_role;
GRANT ALL ON public.payouts TO service_role;
GRANT ALL ON public.delivery_pricing_config TO service_role;
GRANT ALL ON public.push_tokens TO service_role;
GRANT ALL ON public.otp_sessions TO service_role;

GRANT SELECT ON public.feed_rank TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_listing_views(UUID) TO service_role;

-- Demo seed uploads SVG placeholders
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
WHERE id = 'listing-images';
