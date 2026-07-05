-- Proof-of-delivery photos + storage bucket

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS pod_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS pod_captured_at TIMESTAMPTZ;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('delivery-pod', 'delivery-pod', true, 8388608, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "delivery_pod_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'delivery-pod');

CREATE POLICY "delivery_pod_driver_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'delivery-pod'
    AND auth.role() = 'authenticated'
  );
