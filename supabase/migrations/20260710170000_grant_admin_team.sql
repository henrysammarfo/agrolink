-- Grant admin to project team accounts
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) IN (
  'jasonneil4040@gmail.com',
  '0xmhiskall@gmail.com',
  'henrysammarfo@gmail.com',
  'karimnurudeen13@gmail.com',
  'richeyson619@gmail.com',
  'dwayneryan908@gmail.com',
  'royalealaka@gmail.com'
)
ON CONFLICT (user_id, role) DO NOTHING;
