-- Defense in depth: RESTRICTIVE policy on matches.
-- Blocks access without set_current_user_context, even if a permissive USING(true) policy is re-added.
-- Public schedule stays on matches_public view (unchanged).

DROP POLICY IF EXISTS "Require user context for matches access" ON public.matches;

CREATE POLICY "Require user context for matches access"
ON public.matches
AS RESTRICTIVE
FOR ALL
TO public
USING (
  COALESCE(NULLIF(current_setting('app.current_user_role', true), ''), '') <> ''
);

COMMENT ON POLICY "Require user context for matches access" ON public.matches IS
  'RESTRICTIVE baseline: no matches access without validated app.current_user_role. Complements permissive role policies.';
