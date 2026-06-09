-- Remove anon GraphQL/REST table exposure on legacy and internal tables.
-- Public reads use get_public_* RPCs; anon does not need direct SELECT.

REVOKE SELECT ON TABLE public._old_competition_standings FROM anon;
REVOKE SELECT ON TABLE public._old_referee_assignments FROM anon;
REVOKE SELECT ON TABLE public._old_referee_availability FROM anon;

REVOKE SELECT ON TABLE public.matches FROM anon;
REVOKE SELECT ON TABLE public.players FROM anon;
REVOKE SELECT ON TABLE public.teams FROM anon;
REVOKE SELECT ON TABLE public.team_users FROM anon;
REVOKE SELECT ON TABLE public.team_costs FROM anon;
REVOKE SELECT ON TABLE public.costs FROM anon;
REVOKE SELECT ON TABLE public.referee_matches FROM anon;

COMMENT ON TABLE public._old_competition_standings IS
  'Legacy archive — no anon API; authenticated admin backup only.';
COMMENT ON TABLE public._old_referee_assignments IS
  'Legacy archive — no anon API; authenticated admin backup only.';
COMMENT ON TABLE public._old_referee_availability IS
  'Legacy archive — no anon API; authenticated admin backup only.';
