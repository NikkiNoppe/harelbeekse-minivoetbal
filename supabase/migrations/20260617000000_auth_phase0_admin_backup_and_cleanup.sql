-- Phase 0: admin database backup via session RPC; periodic auth table cleanup.

CREATE OR REPLACE FUNCTION public.get_admin_database_backup_for_session(p_session_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_result jsonb := '{}'::jsonb;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN '{}'::jsonb;
  END IF;

  v_result := jsonb_build_object(
    'teams', COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.teams t), '[]'::jsonb),
    'players', COALESCE((SELECT jsonb_agg(to_jsonb(p)) FROM public.players p), '[]'::jsonb),
    'matches', COALESCE((SELECT jsonb_agg(to_jsonb(m)) FROM public.matches m), '[]'::jsonb),
    'users', COALESCE((SELECT jsonb_agg(to_jsonb(u)) FROM public.users u), '[]'::jsonb),
    'team_users', COALESCE((SELECT jsonb_agg(to_jsonb(tu)) FROM public.team_users tu), '[]'::jsonb),
    'costs', COALESCE((SELECT jsonb_agg(to_jsonb(c)) FROM public.costs c), '[]'::jsonb),
    'team_costs', COALESCE((SELECT jsonb_agg(to_jsonb(tc)) FROM public.team_costs tc), '[]'::jsonb),
    'application_settings', COALESCE((SELECT jsonb_agg(to_jsonb(s)) FROM public.application_settings s), '[]'::jsonb),
    'referee_matches', COALESCE((SELECT jsonb_agg(to_jsonb(rm)) FROM public.referee_matches rm), '[]'::jsonb)
  );

  IF to_regclass('public._old_competition_standings') IS NOT NULL THEN
    v_result := v_result || jsonb_build_object(
      '_old_competition_standings',
      COALESCE(
        (SELECT jsonb_agg(to_jsonb(s)) FROM public._old_competition_standings s),
        '[]'::jsonb
      )
    );
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_database_backup_for_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_database_backup_for_session(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.cleanup_expired_auth_rows()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  DELETE FROM public.user_sessions WHERE expires_at < now();

  DELETE FROM public.password_reset_tokens
  WHERE expires_at < now()
     OR used_at IS NOT NULL;

  DELETE FROM public.auth_rate_limits
  WHERE window_start < now() - interval '7 days';
END;
$$;

REVOKE ALL ON FUNCTION private.cleanup_expired_auth_rows() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.cleanup_expired_auth_rows() TO postgres, service_role;

DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'cleanup-expired-auth-rows';

    PERFORM cron.schedule(
      'cleanup-expired-auth-rows',
      '0 3 * * *',
      $cmd$SELECT private.cleanup_expired_auth_rows()$cmd$
    );
  END IF;
END;
$cron$;

COMMENT ON FUNCTION public.get_admin_database_backup_for_session(uuid) IS
  'Admin-only JSON backup export; replaces direct PostgREST table reads from the client.';
