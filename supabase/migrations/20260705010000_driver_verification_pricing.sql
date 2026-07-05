-- Driver verification, disputes, payouts, delivery pricing config

ALTER TABLE public.driver_profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'submitted', 'under_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS license_expiry DATE,
  ADD COLUMN IF NOT EXISTS vehicle_make TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_color TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_year INT,
  ADD COLUMN IF NOT EXISTS ghana_card_id TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id UUID NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('drivers_license', 'vehicle_registration', 'insurance', 'profile_photo', 'ghana_card')),
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_profile_id, doc_type)
);

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution TEXT,
  events JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GHS',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  momo_number TEXT,
  momo_network TEXT,
  provider_reference TEXT,
  role_context TEXT NOT NULL DEFAULT 'farmer' CHECK (role_context IN ('farmer', 'driver')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'default',
  base_fare NUMERIC(8,2) NOT NULL DEFAULT 15,
  per_km_rate NUMERIC(8,2) NOT NULL DEFAULT 2.5,
  per_kg_rate NUMERIC(8,2) NOT NULL DEFAULT 0.5,
  free_kg NUMERIC(8,2) NOT NULL DEFAULT 20,
  min_fare NUMERIC(8,2) NOT NULL DEFAULT 25,
  platform_fee_pct NUMERIC(5,4) NOT NULL DEFAULT 0.06,
  peak_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.2,
  motorcycle_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  pickup_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.4,
  truck_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.8,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.delivery_pricing_config (name) VALUES ('default') ON CONFLICT DO NOTHING;

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS fee_breakdown JSONB;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_fee_breakdown JSONB;

-- Storage for driver documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('driver-documents', 'driver-documents', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_docs_owner" ON public.driver_documents FOR ALL
  USING (EXISTS (SELECT 1 FROM public.driver_profiles dp WHERE dp.id = driver_profile_id AND dp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.driver_profiles dp WHERE dp.id = driver_profile_id AND dp.user_id = auth.uid()));

CREATE POLICY "driver_docs_admin" ON public.driver_documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "disputes_participant" ON public.disputes FOR ALL
  USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "payouts_self" ON public.payouts FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payouts_admin_insert" ON public.payouts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "pricing_public_read" ON public.delivery_pricing_config FOR SELECT USING (active = true);

CREATE POLICY "driver_docs_storage" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'driver-documents' AND auth.role() = 'authenticated');
CREATE POLICY "driver_docs_storage_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

GRANT ALL ON public.driver_documents TO authenticated;
GRANT ALL ON public.disputes TO authenticated;
GRANT SELECT ON public.payouts TO authenticated;
GRANT SELECT ON public.delivery_pricing_config TO anon, authenticated;
