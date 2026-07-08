-- Farmers could insert listings but INSERT … RETURNING failed SELECT RLS because
-- policies call public.has_role() while EXECUTE was revoked from authenticated.

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Mobile cameras (especially iOS) often upload HEIC/HEIF photos.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/heic',
  'image/heif'
]
WHERE id = 'listing-images';
