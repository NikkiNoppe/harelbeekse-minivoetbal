
-- Revoke SELECT on tables/views from the unused `authenticated` role
REVOKE SELECT ON public.application_settings FROM authenticated;
REVOKE SELECT ON public.costs FROM authenticated;
REVOKE SELECT ON public.matches FROM authenticated;
REVOKE SELECT ON public.organizations FROM authenticated;
REVOKE SELECT ON public.players FROM authenticated;
REVOKE SELECT ON public.referee_matches FROM authenticated;
REVOKE SELECT ON public.team_costs FROM authenticated;
REVOKE SELECT ON public.team_users FROM authenticated;
REVOKE SELECT ON public.teams FROM authenticated;
REVOKE SELECT ON public.users FROM authenticated;
REVOKE SELECT ON public.profiles FROM authenticated;

-- Revoke EXECUTE on SECURITY DEFINER functions from the unused `authenticated` role
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM authenticated',
                   r.proname, r.args);
  END LOOP;
END $$;
