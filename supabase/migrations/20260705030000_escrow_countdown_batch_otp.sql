-- Escrow, job accept countdown, batch pickups, OTP sessions

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paystack_subaccount_code TEXT,
  ADD COLUMN IF NOT EXISTS bank_code TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS escrow_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (escrow_status IN ('pending', 'held', 'released', 'refunded')),
  ADD COLUMN IF NOT EXISTS escrow_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ;

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS accept_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS offer_round INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pickup_stops JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'held'
    CHECK (escrow_status IN ('held', 'released', 'refunded')),
  ADD COLUMN IF NOT EXISTS paystack_split JSONB;

CREATE TABLE IF NOT EXISTS public.otp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'checkout',
  amount_threshold NUMERIC(12,2),
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS otp_sessions_user_idx ON public.otp_sessions(user_id, purpose);
CREATE INDEX IF NOT EXISTS deliveries_accept_deadline_idx ON public.deliveries(accept_deadline)
  WHERE status = 'requested' AND driver_id IS NULL;

ALTER TABLE public.otp_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "otp_own_read" ON public.otp_sessions FOR SELECT USING (user_id = auth.uid());

GRANT ALL ON public.otp_sessions TO authenticated;
