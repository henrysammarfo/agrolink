-- Allow admins to approve/reject listings from the moderation UI
CREATE POLICY "listings_admin_update"
  ON public.listings
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
