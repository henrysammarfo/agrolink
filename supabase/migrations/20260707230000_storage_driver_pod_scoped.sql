-- Owner-scoped driver documents and delivery POD uploads (path must be {user_id}/...)

DROP POLICY IF EXISTS "driver_docs_storage" ON storage.objects;

CREATE POLICY "driver_docs_owner_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'driver-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "driver_docs_owner_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'driver-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "driver_docs_owner_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'driver-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all driver docs for verification review
DROP POLICY IF EXISTS "driver_docs_storage_read" ON storage.objects;
CREATE POLICY "driver_docs_owner_read" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'driver-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "driver_docs_admin_read" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'driver-documents'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Delivery proof-of-delivery photos — driver uploads to own folder
DROP POLICY IF EXISTS "delivery_pod_driver_upload" ON storage.objects;

CREATE POLICY "delivery_pod_owner_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'delivery-pod'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "delivery_pod_owner_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'delivery-pod'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "delivery_pod_owner_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'delivery-pod'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Chat attachments — owner update/delete (insert already scoped)
CREATE POLICY "chat_attachments_owner_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "chat_attachments_owner_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
