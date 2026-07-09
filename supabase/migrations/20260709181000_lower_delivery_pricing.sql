-- Lower delivery pricing for Ghana market (Bolt-competitive)
UPDATE public.delivery_pricing_config
SET
  base_fare = 8,
  per_km_rate = 1.2,
  per_kg_rate = 0.25,
  free_kg = 25,
  min_fare = 12,
  platform_fee_pct = 0.04,
  peak_multiplier = 1.1,
  motorcycle_multiplier = 1.0,
  pickup_multiplier = 1.25,
  truck_multiplier = 1.5
WHERE name = 'default';
