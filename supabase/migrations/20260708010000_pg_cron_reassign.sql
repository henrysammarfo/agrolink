-- Scheduled delivery reassign via pg_cron + pg_net (no GitHub Actions / Vercel Pro needed).
-- After deploy: npm run cron:configure  (sets site URL + CRON_SECRET in internal_cron_config)

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.internal_cron_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_url text NOT NULL DEFAULT '',
  cron_secret text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.internal_cron_config ENABLE ROW LEVEL SECURITY;

INSERT INTO public.internal_cron_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Remove previous schedule if re-applying migration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reassign-expired-deliveries') THEN
    PERFORM cron.unschedule('reassign-expired-deliveries');
  END IF;
END;
$$;

SELECT cron.schedule(
  'reassign-expired-deliveries',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT rtrim(site_url, '/') || '/api/deliveries/reassign-expired'
      FROM public.internal_cron_config
      WHERE id = 1 AND site_url <> '' AND cron_secret <> ''
    ),
    headers := (
      SELECT jsonb_build_object(
        'Authorization', 'Bearer ' || cron_secret,
        'Content-Type', 'application/json'
      )
      FROM public.internal_cron_config
      WHERE id = 1 AND site_url <> '' AND cron_secret <> ''
    ),
    body := '{}'::jsonb
  )
  WHERE EXISTS (
    SELECT 1 FROM public.internal_cron_config
    WHERE id = 1 AND site_url <> '' AND cron_secret <> ''
  );
  $$
);
