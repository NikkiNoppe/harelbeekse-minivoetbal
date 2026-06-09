-- Fase C: apply INVOKER wrappers to all client-facing public SECURITY DEFINER RPCs (lint 0028).

DO $$
DECLARE
  r RECORD;
  v_exclude text[] := ARRAY[
    -- Internal-only (Fase B)
    'resolve_session_role',
    'resolve_session_for_costs',
    'validate_session',
    'check_email_rate_limit',
    'check_referee_conflict',
    'check_password_reset_limit',
    -- Triggers / batch internal (already revoked in 20260614000000)
    'apply_suspension_after_match',
    'reduce_suspension_after_match',
    'process_match_costs',
    'process_match_financial_costs',
    'update_player_cards',
    'update_team_balances',
    'sync_referee_fields',
    'auto_generate_poll_month',
    'match_has_forfait_penalty',
    'match_played_with_scores',
    'get_current_user_role',
    'is_current_user_admin',
    'get_current_user_team_ids',
    'set_config',
    'set_current_user_context',
    'clear_app_user_context',
    'apply_app_user_context',
    'create_public_invoker_wrapper',
    -- Fase D: recreated with session token in 20260615030000
    'is_player_suspended',
    'check_batch_players_suspended'
  ];
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.prosecdef = true
      AND NOT (p.proname = ANY (v_exclude))
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
    ORDER BY p.proname, pg_get_function_identity_arguments(p.oid)
  LOOP
    PERFORM private.create_public_invoker_wrapper(r.oid);
  END LOOP;
END;
$$;
