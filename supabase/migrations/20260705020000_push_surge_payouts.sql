-- Push tokens, surge pricing, payout tracking

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web' CHECK (platform IN ('web', 'android', 'ios')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE public.delivery_pricing_config
  ADD COLUMN IF NOT EXISTS surge_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS surge_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS surge_reason TEXT,
  ADD COLUMN IF NOT EXISTS driver_payout_pct NUMERIC(5,4) NOT NULL DEFAULT 0.75,
  ADD COLUMN IF NOT EXISTS farmer_payout_pct NUMERIC(5,4) NOT NULL DEFAULT 0.94;

ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_id UUID REFERENCES public.deliveries(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payouts_processed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.driver_profiles
  ADD COLUMN IF NOT EXISTS ghana_card_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ghana_card_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON public.push_tokens(user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_tokens_self" ON public.push_tokens FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT ALL ON public.push_tokens TO authenticated;
