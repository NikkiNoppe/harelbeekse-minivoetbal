-- Revoke client access to RLS helper functions and sensitive GraphQL schema objects.

REVOKE ALL ON FUNCTION public.get_current_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_current_user_team_ids() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_team_ids() TO postgres, service_role;

-- GraphQL exposure hardening (pg_graphql uses graphql_public role when enabled).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'graphql_public') THEN
    REVOKE ALL ON TABLE public.users FROM graphql_public;
    REVOKE ALL ON TABLE public.players FROM graphql_public;
    REVOKE ALL ON TABLE public.user_sessions FROM graphql_public;
    REVOKE ALL ON TABLE public.password_reset_tokens FROM graphql_public;
    REVOKE ALL ON TABLE public.team_transactions FROM graphql_public;
    REVOKE ALL ON TABLE public.auth_rate_limits FROM graphql_public;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_current_user_role() IS
  'Internal RLS helper — not callable by anon/authenticated clients.';
