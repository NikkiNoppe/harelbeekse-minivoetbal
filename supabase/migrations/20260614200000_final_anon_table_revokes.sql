-- Phase D: final anon SELECT revokes after client migration to session RPCs.
-- matches, players, teams, team_costs, costs, application_settings already revoked in 20260612020000.

REVOKE SELECT ON TABLE public.users FROM anon;
REVOKE SELECT ON TABLE public.team_users FROM anon;
REVOKE SELECT ON TABLE public.referee_matches FROM anon;

-- Tier B: legacy balance helper (replaced by get_team_balance_for_session)
REVOKE ALL ON FUNCTION public.calculate_team_balance_updated(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_team_balance_updated(integer) TO postgres, service_role;

-- Tier A: old get_team_recipients without session (if still present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_team_recipients'
  ) THEN
    REVOKE ALL ON FUNCTION public.get_team_recipients(integer[]) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.get_team_recipients(integer[]) TO postgres, service_role;
  END IF;
END $$;
