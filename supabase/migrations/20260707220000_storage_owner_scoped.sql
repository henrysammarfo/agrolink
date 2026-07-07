-- User-scoped listing media uploads (path must be {user_id}/...)
-- Demo seed uses service_role which bypasses storage RLS.

DROP POLICY IF EXISTS "listing_images_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "listing_videos_auth_upload" ON storage.objects;

CREATE POLICY "listing_images_owner_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "listing_images_owner_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "listing_images_owner_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "listing_videos_owner_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "listing_videos_owner_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "listing_videos_owner_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
