-- Fix orders ↔ order_items RLS recursion, listing reads for buyers, comments access.

DROP POLICY IF EXISTS "order_items_read" ON public.order_items;
CREATE POLICY "order_items_read" ON public.order_items FOR SELECT
  USING (
    seller_id = auth.uid()
    OR public.order_visible_to_user(order_id)
  );

DROP POLICY IF EXISTS "orders_buyer_read" ON public.orders;
CREATE POLICY "orders_buyer_read" ON public.orders FOR SELECT
  USING (
    public.order_visible_to_user(id)
    OR public.user_is_assigned_driver_for_order(id)
  );

-- Buyers can read listing details on orders they placed (even after sold_out).
DROP POLICY IF EXISTS "listings_public_read" ON public.listings;
CREATE POLICY "listings_public_read" ON public.listings FOR SELECT
  USING (
    status = 'active'
    OR seller_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.listing_id = listings.id AND o.buyer_id = auth.uid()
    )
  );

GRANT SELECT ON public.listing_comments TO anon;
