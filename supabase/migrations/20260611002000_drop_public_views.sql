-- Remove anon-accessible bypass views; public data via get_public_matches / get_public_teams RPCs.

REVOKE SELECT ON public.matches_public FROM anon, authenticated;
REVOKE SELECT ON public.teams_public FROM anon, authenticated;

DROP VIEW IF EXISTS public.matches_public;
DROP VIEW IF EXISTS public.teams_public;
