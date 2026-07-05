-- Notification prefs on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS marketing_enabled BOOLEAN NOT NULL DEFAULT false;

-- Chat attachments
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT CHECK (attachment_type IN ('image', 'video'));

-- Chat attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "chat_attachments_insert" ON storage.objects;
CREATE POLICY "chat_attachments_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "chat_attachments_select" ON storage.objects;
CREATE POLICY "chat_attachments_select" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'chat-attachments');

-- Service role can upload demo listing media
DROP POLICY IF EXISTS "listing_images_demo_service" ON storage.objects;
CREATE POLICY "listing_images_demo_service" ON storage.objects FOR ALL
  TO service_role USING (bucket_id = 'listing-images');

-- Admin can update delivery pricing (surge)
DROP POLICY IF EXISTS "pricing_admin_update" ON public.delivery_pricing_config;
CREATE POLICY "pricing_admin_update" ON public.delivery_pricing_config FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "pricing_admin_select_all" ON public.delivery_pricing_config;
CREATE POLICY "pricing_admin_select_all" ON public.delivery_pricing_config FOR SELECT
  TO authenticated
  USING (
    active = true
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
