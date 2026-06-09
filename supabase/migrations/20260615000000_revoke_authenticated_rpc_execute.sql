-- Fase A: app uses anon key only — remove authenticated EXECUTE on all public functions (lint 0029).

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
      AND p.prokind = 'f'
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM authenticated',
      r.schema_name,
      r.function_name,
      r.args
    );
  END LOOP;
END;
$$;

COMMENT ON SCHEMA public IS
  'Client API: session-token RPCs via anon EXECUTE only (authenticated EXECUTE revoked — lint 0029).';
