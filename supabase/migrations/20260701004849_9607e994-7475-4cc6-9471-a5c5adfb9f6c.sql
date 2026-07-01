DROP POLICY IF EXISTS user_roles_self_insert ON public.user_roles;
CREATE POLICY "user_roles_self_insert_non_admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role <> 'admin'::public.app_role);