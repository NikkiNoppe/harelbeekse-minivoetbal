-- Lint 0006: costs had overlapping ALL (admin) + SELECT (public read).

DROP POLICY IF EXISTS "Only admins can manage costs" ON public.costs;

CREATE POLICY "Insert costs as admin"
ON public.costs
FOR INSERT
TO public
WITH CHECK ((SELECT get_current_user_role()) = 'admin');

CREATE POLICY "Update costs as admin"
ON public.costs
FOR UPDATE
TO public
USING ((SELECT get_current_user_role()) = 'admin')
WITH CHECK ((SELECT get_current_user_role()) = 'admin');

CREATE POLICY "Delete costs as admin"
ON public.costs
FOR DELETE
TO public
USING ((SELECT get_current_user_role()) = 'admin');
