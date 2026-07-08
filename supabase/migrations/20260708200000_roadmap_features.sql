-- Roadmap: driver matching, message requests, profile views, avatars, public bookmarks

-- Delivery matching fields
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS required_vehicle_type TEXT DEFAULT 'motorcycle',
  ADD COLUMN IF NOT EXISTS search_radius_km NUMERIC(8,2) DEFAULT 20,
  ADD COLUMN IF NOT EXISTS declined_driver_ids UUID[] DEFAULT '{}';

-- Profile preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_view_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS public_bookmarks BOOLEAN DEFAULT false;

-- Message requests (non-follower DMs)
CREATE TABLE IF NOT EXISTS public.message_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, recipient_id)
);
CREATE INDEX IF NOT EXISTS message_requests_recipient_idx ON public.message_requests(recipient_id, status);

ALTER TABLE public.message_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "message_requests_participant" ON public.message_requests FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = recipient_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_requests TO authenticated;
GRANT ALL ON public.message_requests TO service_role;

-- Trip chat context on messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS delivery_id UUID REFERENCES public.deliveries(id) ON DELETE SET NULL;

-- Profile view tracking
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_views_profile_idx ON public.profile_views(profile_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS profile_views_viewer_idx ON public.profile_views(viewer_id, profile_id, viewed_at DESC);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_views_insert" ON public.profile_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id AND viewer_id IS DISTINCT FROM profile_id);
CREATE POLICY "profile_views_owner_read" ON public.profile_views FOR SELECT
  USING (auth.uid() = profile_id OR auth.uid() = viewer_id);

GRANT SELECT, INSERT ON public.profile_views TO authenticated;
GRANT ALL ON public.profile_views TO service_role;

-- Public bookmarks read when farmer opts in
CREATE POLICY "bookmarks_public_read" ON public.bookmarks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = bookmarks.user_id AND p.public_bookmarks = true
    )
  );

-- Avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_owner_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_owner_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime for live chat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
