-- Break deliveries <-> orders RLS infinite recursion (driver job queries).

CREATE OR REPLACE FUNCTION public.order_visible_to_user(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = p_order_id
      AND (
        o.buyer_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.order_items oi
          WHERE oi.order_id = o.id AND oi.seller_id = auth.uid()
        )
        OR public.has_role(auth.uid(), 'admin')
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_delivery_driver(p_delivery_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.deliveries d
    JOIN public.driver_profiles dp ON dp.id = d.driver_id
    WHERE d.id = p_delivery_id AND dp.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_assigned_driver_for_order(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.deliveries d
    JOIN public.driver_profiles dp ON dp.id = d.driver_id
    WHERE d.order_id = p_order_id AND dp.user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "deliveries_participant_read" ON public.deliveries;
CREATE POLICY "deliveries_participant_read" ON public.deliveries FOR SELECT
  USING (
    public.order_visible_to_user(order_id)
    OR public.user_is_delivery_driver(id)
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "orders_buyer_read" ON public.orders;
CREATE POLICY "orders_buyer_read" ON public.orders FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.order_items oi
      WHERE oi.order_id = orders.id AND oi.seller_id = auth.uid()
    )
    OR public.user_is_assigned_driver_for_order(id)
    OR public.has_role(auth.uid(), 'admin')
  );

GRANT EXECUTE ON FUNCTION public.order_visible_to_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_delivery_driver(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_assigned_driver_for_order(uuid) TO authenticated;
