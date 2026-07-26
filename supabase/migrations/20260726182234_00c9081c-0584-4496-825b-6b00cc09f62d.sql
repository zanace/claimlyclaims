DROP POLICY IF EXISTS apps_select ON public.applications;
DROP POLICY IF EXISTS apps_update ON public.applications;

CREATE POLICY apps_select_own_or_admin ON public.applications
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY apps_update_own_or_admin ON public.applications
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));