-- Seed market prices for AI price advice (run after marketplace_core migration)
INSERT INTO public.market_prices (crop_type, region, price, unit, source) VALUES
  ('tomato', 'Greater Accra', 12.50, 'kg', 'Agbogbloshie'),
  ('tomato', 'Greater Accra', 13.20, 'kg', 'Tema'),
  ('pepper', 'Greater Accra', 15.00, 'kg', 'Agbogbloshie'),
  ('garden_egg', 'Greater Accra', 8.00, 'kg', 'Dodowa'),
  ('okra', 'Greater Accra', 10.00, 'kg', 'Afienya'),
  ('leafy_greens', 'Greater Accra', 6.50, 'kg', 'Ada Foah'),
  ('onion', 'Greater Accra', 9.00, 'kg', 'Techiman corridor'),
  ('cabbage', 'Greater Accra', 7.50, 'kg', 'Tema')
ON CONFLICT DO NOTHING;
