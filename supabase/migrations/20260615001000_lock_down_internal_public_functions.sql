-- Fase B: internal helpers — not client-callable (lint 0028 on anon).

-- Legacy password verify (unused in client)
DROP FUNCTION IF EXISTS public.verify_user_password(text, text);
DROP FUNCTION IF EXISTS public.verify_user_password_flexible(text, text);

-- Unused statistics RPC
DROP FUNCTION IF EXISTS public.get_match_statistics(integer);

-- Internal-only: revoke anon/authenticated EXECUTE
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
        'resolve_session_role',
        'resolve_session_for_costs',
        'validate_session',
        'check_email_rate_limit',
        'check_referee_conflict',
        'check_password_reset_limit'
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
