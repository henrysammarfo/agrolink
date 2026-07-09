-- Backfill profile slugs so public profile links work
UPDATE public.profiles
SET slug = lower(regexp_replace(display_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 8)
WHERE slug IS NULL AND display_name IS NOT NULL;

-- Verified drivers can browse open delivery jobs (unassigned, requested)
CREATE POLICY "deliveries_verified_driver_read_open" ON public.deliveries FOR SELECT
  USING (
    status = 'requested'
    AND driver_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.driver_profiles dp
      WHERE dp.user_id = auth.uid()
        AND dp.verification_status = 'approved'
    )
  );

-- Verified drivers can read buyer_id on orders tied to open deliveries
CREATE POLICY "orders_verified_driver_open_delivery" ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deliveries d
      JOIN public.driver_profiles dp ON dp.user_id = auth.uid() AND dp.verification_status = 'approved'
      WHERE d.order_id = orders.id
        AND d.status = 'requested'
        AND d.driver_id IS NULL
    )
  );
