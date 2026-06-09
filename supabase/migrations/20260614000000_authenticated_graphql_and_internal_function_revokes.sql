-- Security Advisor phase A:
-- 1) Lint 0027: hide sensitive tables from authenticated / GraphQL schema
-- 2) Revoke client EXECUTE on internal, trigger, and legacy spoofable functions

-- =============================================================================
-- 1) authenticated SELECT revoke (app uses anon key only)
-- =============================================================================
REVOKE SELECT ON TABLE public._old_competition_standings FROM authenticated;
REVOKE SELECT ON TABLE public._old_referee_assignments FROM authenticated;
REVOKE SELECT ON TABLE public._old_referee_availability FROM authenticated;
REVOKE SELECT ON TABLE public.application_settings FROM authenticated;
REVOKE SELECT ON TABLE public.costs FROM authenticated;
REVOKE SELECT ON TABLE public.matches FROM authenticated;
REVOKE SELECT ON TABLE public.players FROM authenticated;
REVOKE SELECT ON TABLE public.referee_matches FROM authenticated;
REVOKE SELECT ON TABLE public.team_costs FROM authenticated;
REVOKE SELECT ON TABLE public.team_users FROM authenticated;
REVOKE SELECT ON TABLE public.teams FROM authenticated;
REVOKE SELECT ON TABLE public.users FROM authenticated;

-- =============================================================================
-- 2) graphql_public hardening (extends 20260613120000)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'graphql_public') THEN
    REVOKE ALL ON TABLE public._old_competition_standings FROM graphql_public;
    REVOKE ALL ON TABLE public._old_referee_assignments FROM graphql_public;
    REVOKE ALL ON TABLE public._old_referee_availability FROM graphql_public;
    REVOKE ALL ON TABLE public.application_settings FROM graphql_public;
    REVOKE ALL ON TABLE public.costs FROM graphql_public;
    REVOKE ALL ON TABLE public.matches FROM graphql_public;
    REVOKE ALL ON TABLE public.players FROM graphql_public;
    REVOKE ALL ON TABLE public.referee_matches FROM graphql_public;
    REVOKE ALL ON TABLE public.team_costs FROM graphql_public;
    REVOKE ALL ON TABLE public.team_users FROM graphql_public;
    REVOKE ALL ON TABLE public.teams FROM graphql_public;
    REVOKE ALL ON TABLE public.users FROM graphql_public;
  END IF;
END;
$$;

-- =============================================================================
-- 3) Internal-only functions: revoke client EXECUTE, keep for triggers/service_role
-- =============================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        -- Legacy spoofable
        'add_team_cost',
        'add_team_deposit',
        'add_team_cost_as_admin',
        'delete_team_cost_as_admin',
        'update_team_cost_as_admin',
        'manage_blog_post',
        -- Trigger / batch internal
        'process_match_costs',
        'process_match_financial_costs',
        'update_team_balances',
        'update_player_cards',
        'reduce_suspension_after_match',
        'apply_suspension_after_match',
        'sync_referee_fields',
        'auto_generate_poll_month',
        'set_transaction_amount_from_cost_setting',
        'trg_match_cost_delete_sets_skip_auto',
        'trg_strip_match_costs_on_forfait_penalty',
        'prevent_player_data_wipe',
        'validate_player_data',
        'log_cost_setting_change',
        -- RLS / helper (not client API)
        'can_current_user_manage_player',
        'can_read_player_for_match',
        'is_admin_user',
        'calculate_team_balance',
        'calculate_team_balance_final',
        'match_has_forfait_penalty',
        'match_played_with_scores',
        -- Context helpers (service_role only)
        'apply_app_user_context',
        'clear_app_user_context'
      ])
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      r.schema_name,
      r.function_name,
      r.args
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO postgres, service_role',
      r.schema_name,
      r.function_name,
      r.args
    );
  END LOOP;
END;
$$;

COMMENT ON SCHEMA public IS
  'Client API: session-token SECURITY DEFINER RPCs (anon EXECUTE) + get_public_* reads. '
  'Direct table SELECT for anon/authenticated is revoked on sensitive tables; internal trigger functions are not client-callable.';
