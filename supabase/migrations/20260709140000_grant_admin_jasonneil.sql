-- Grant admin role to jasonneil4040@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'jasonneil4040@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
