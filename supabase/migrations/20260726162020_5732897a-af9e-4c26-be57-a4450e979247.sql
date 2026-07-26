DROP POLICY IF EXISTS apps_select ON public.applications;
CREATE POLICY apps_select ON public.applications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS apps_update ON public.applications;
CREATE POLICY apps_update ON public.applications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);