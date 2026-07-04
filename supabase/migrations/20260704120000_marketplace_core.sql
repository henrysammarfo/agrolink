-- AgroLink marketplace core schema

-- Enums
CREATE TYPE public.listing_status AS ENUM ('active', 'sold_out', 'reserved', 'expired', 'inactive', 'pending_review', 'rejected');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'pending', 'paid', 'refunded', 'failed');
CREATE TYPE public.delivery_status AS ENUM ('requested', 'driver_assigned', 'driver_enroute_pickup', 'picked_up', 'enroute_delivery', 'delivered', 'cancelled');
CREATE TYPE public.payment_provider AS ENUM ('paystack', 'hubtel');
CREATE TYPE public.crop_type AS ENUM ('tomato', 'pepper', 'garden_egg', 'okra', 'leafy_greens', 'onion', 'cucumber', 'cabbage', 'other');

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS momo_number TEXT,
  ADD COLUMN IF NOT EXISTS momo_network TEXT,
  ADD COLUMN IF NOT EXISTS seller_rating NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_rating_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS listing_count INT DEFAULT 0;

-- Recreate bookmarks with UUID listing_id FK
DROP TABLE IF EXISTS public.bookmarks CASCADE;
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks_self" ON public.bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;

-- Listings
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  crop_type public.crop_type NOT NULL DEFAULT 'other',
  description TEXT,
  price_per_unit NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  quantity NUMERIC(12,2) NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  location_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  image_url TEXT,
  video_url TEXT,
  status public.listing_status NOT NULL DEFAULT 'pending_review',
  view_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  save_count INT NOT NULL DEFAULT 0,
  report_count INT NOT NULL DEFAULT 0,
  organic BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX listings_seller_idx ON public.listings(seller_id);
CREATE INDEX listings_status_idx ON public.listings(status);
CREATE INDEX listings_created_idx ON public.listings(created_at DESC);

-- Listing engagement
CREATE TABLE public.listing_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, user_id)
);

CREATE TABLE public.listing_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX listing_comments_listing_idx ON public.listing_comments(listing_id);

CREATE TABLE public.listing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, user_id)
);

-- Re-add bookmarks FK
ALTER TABLE public.bookmarks
  ADD CONSTRAINT bookmarks_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

-- Carts
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cart_id, listing_id)
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 70,
  platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GHS',
  delivery_address TEXT,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_buyer_idx ON public.orders(buyer_id);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
CREATE INDEX order_items_seller_idx ON public.order_items(seller_id);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider public.payment_provider NOT NULL DEFAULT 'paystack',
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GHS',
  status public.payment_status NOT NULL DEFAULT 'pending',
  provider_reference TEXT,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payments_order_idx ON public.payments(order_id);

-- Driver profiles
CREATE TABLE public.driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  vehicle_type TEXT NOT NULL DEFAULT 'motorcycle',
  plate_number TEXT,
  capacity TEXT,
  available BOOLEAN NOT NULL DEFAULT false,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  total_deliveries INT NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  momo_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deliveries
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
  driver_id UUID REFERENCES public.driver_profiles(id),
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  pickup_address TEXT NOT NULL,
  delivery_lat DOUBLE PRECISION NOT NULL,
  delivery_lng DOUBLE PRECISION NOT NULL,
  delivery_address TEXT NOT NULL,
  estimated_distance_km NUMERIC(8,2),
  estimated_cost NUMERIC(12,2),
  status public.delivery_status NOT NULL DEFAULT 'requested',
  tracking_updates JSONB DEFAULT '[]',
  scheduled_pickup TIMESTAMPTZ,
  actual_pickup TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX deliveries_driver_idx ON public.deliveries(driver_id);
CREATE INDEX deliveries_status_idx ON public.deliveries(status);

-- Notifications + messages
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_participants_idx ON public.messages(sender_id, receiver_id);

-- Market prices + AI analysis
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type public.crop_type NOT NULL,
  region TEXT NOT NULL,
  district TEXT,
  price NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  source TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE UNIQUE,
  quality_grade TEXT,
  demand_score NUMERIC(4,3),
  price_advice TEXT,
  moderation_passed BOOLEAN NOT NULL DEFAULT false,
  moderation_reason TEXT,
  insights TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feed ranking view
CREATE OR REPLACE VIEW public.feed_rank AS
SELECT
  l.*,
  p.display_name AS seller_name,
  p.slug AS seller_slug,
  p.avatar_url AS seller_avatar,
  p.verified AS seller_verified,
  p.seller_rating,
  COALESCE(a.demand_score, 0.5) AS ai_demand_score,
  (
    0.25 * GREATEST(0, 1 - EXTRACT(EPOCH FROM (now() - l.created_at)) / 604800)
    + 0.20 * LEAST(1, (l.like_count * 0.5 + l.comment_count * 2 + l.save_count * 1.5 + l.view_count * 0.01) / 100)
    + 0.10 * (CASE WHEN p.verified THEN 0.4 ELSE 0 END + COALESCE(p.seller_rating, 0) / 5 * 0.4 + 0.2)
    + 0.10 * COALESCE(a.demand_score, 0.5)
    - LEAST(0.5, l.report_count * 0.1)
    + CASE WHEN COALESCE(p.listing_count, 0) <= 10 THEN 0.15 ELSE 0 END
  ) AS feed_score
FROM public.listings l
JOIN public.profiles p ON p.id = l.seller_id
LEFT JOIN public.ai_analysis a ON a.listing_id = l.id
WHERE l.status = 'active';

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('listing-images', 'listing-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('listing-videos', 'listing-videos', true, 52428800, ARRAY['video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- RLS enable
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Listings policies
CREATE POLICY "listings_public_read" ON public.listings FOR SELECT USING (status = 'active' OR seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "listings_seller_insert" ON public.listings FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "listings_seller_update" ON public.listings FOR UPDATE USING (seller_id = auth.uid());
CREATE POLICY "listings_seller_delete" ON public.listings FOR DELETE USING (seller_id = auth.uid());

-- Engagement policies
CREATE POLICY "likes_public_read" ON public.listing_likes FOR SELECT USING (true);
CREATE POLICY "likes_self_write" ON public.listing_likes FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments_public_read" ON public.listing_comments FOR SELECT USING (true);
CREATE POLICY "comments_self_write" ON public.listing_comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "reports_self_write" ON public.listing_reports FOR INSERT WITH CHECK (user_id = auth.uid());

-- Cart policies
CREATE POLICY "carts_self" ON public.carts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "cart_items_via_cart" ON public.cart_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()));

-- Order policies
CREATE POLICY "orders_buyer_read" ON public.orders FOR SELECT
  USING (buyer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = id AND oi.seller_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.deliveries d JOIN public.driver_profiles dp ON dp.id = d.driver_id WHERE d.order_id = id AND dp.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "orders_buyer_insert" ON public.orders FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "orders_participant_update" ON public.orders FOR UPDATE
  USING (buyer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = id AND oi.seller_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "order_items_read" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (
    o.buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )));
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.buyer_id = auth.uid()));

-- Payments: no client access
CREATE POLICY "payments_no_client" ON public.payments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Driver policies
CREATE POLICY "drivers_public_read" ON public.driver_profiles FOR SELECT USING (true);
CREATE POLICY "drivers_self_write" ON public.driver_profiles FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Delivery policies
CREATE POLICY "deliveries_participant_read" ON public.deliveries FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.buyer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = order_id AND oi.seller_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.driver_profiles dp WHERE dp.id = driver_id AND dp.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "deliveries_driver_update" ON public.deliveries FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.driver_profiles dp WHERE dp.id = driver_id AND dp.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));

-- Notifications + messages
CREATE POLICY "notifications_self" ON public.notifications FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "messages_participant" ON public.messages FOR ALL
  USING (sender_id = auth.uid() OR receiver_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Market prices + AI (public read)
CREATE POLICY "market_prices_public_read" ON public.market_prices FOR SELECT USING (true);
CREATE POLICY "ai_analysis_public_read" ON public.ai_analysis FOR SELECT USING (true);

-- Audit log admin only
CREATE POLICY "audit_admin_read" ON public.audit_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies
CREATE POLICY "listing_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "listing_images_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');
CREATE POLICY "listing_videos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'listing-videos');
CREATE POLICY "listing_videos_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-videos' AND auth.role() = 'authenticated');

-- Grants
GRANT SELECT ON public.feed_rank TO anon, authenticated;
GRANT ALL ON public.listings TO authenticated;
GRANT ALL ON public.listing_likes TO authenticated;
GRANT ALL ON public.listing_comments TO authenticated;
GRANT ALL ON public.listing_reports TO authenticated;
GRANT ALL ON public.carts TO authenticated;
GRANT ALL ON public.cart_items TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.driver_profiles TO authenticated;
GRANT ALL ON public.deliveries TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT SELECT ON public.market_prices TO anon, authenticated;
GRANT SELECT ON public.ai_analysis TO anon, authenticated;

-- Trigger: update listing counts
CREATE OR REPLACE FUNCTION public.update_seller_listing_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET listing_count = listing_count + 1 WHERE id = NEW.seller_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET listing_count = GREATEST(0, listing_count - 1) WHERE id = OLD.seller_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER listings_count_trigger
AFTER INSERT OR DELETE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.update_seller_listing_count();

-- Trigger: generate profile slug
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.slug IS NULL AND NEW.display_name IS NOT NULL THEN
    NEW.slug := lower(regexp_replace(NEW.display_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER profiles_slug_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.generate_profile_slug();

-- RPC: increment view count
CREATE OR REPLACE FUNCTION public.increment_listing_views(listing_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.listings SET view_count = view_count + 1 WHERE id = listing_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.increment_listing_views(UUID) TO anon, authenticated;

-- Enable realtime for deliveries and driver_profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_profiles;
