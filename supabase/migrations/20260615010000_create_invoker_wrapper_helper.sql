-- Helper: move public SECURITY DEFINER RPC to private schema + create public SECURITY INVOKER wrapper (lint 0028).

CREATE OR REPLACE FUNCTION private.create_public_invoker_wrapper(p_func_oid oid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public, private
AS $$
DECLARE
  v_name text;
  v_args text;
  v_args_call text;
  v_result text;
  v_nsp oid;
  v_sql text;
BEGIN
  SELECT p.proname, pg_get_function_identity_arguments(p.oid), pg_get_function_result(p.oid), p.pronamespace
  INTO v_name, v_args, v_result, v_nsp
  FROM pg_proc p
  WHERE p.oid = p_func_oid;

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Function oid % not found', p_func_oid;
  END IF;

  IF v_nsp = 'public'::regnamespace THEN
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET SCHEMA private', v_name, v_args);
  END IF;

  SELECT string_agg(format('%I', n), ', ' ORDER BY ord)
  INTO v_args_call
  FROM (
    SELECT u.ord, COALESCE(u.n, 'arg' || u.ord::text) AS n
    FROM unnest(COALESCE((SELECT proargnames FROM pg_proc WHERE oid = p_func_oid), ARRAY[]::text[]))
      WITH ORDINALITY AS u(n, ord)
  ) s;

  IF v_args_call IS NULL OR v_args_call = '' THEN
    v_args_call := '';
  END IF;

  IF v_result = 'void' THEN
    v_sql := format(
      $f$
CREATE OR REPLACE FUNCTION public.%I(%s)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public, private
AS $b$
BEGIN
  PERFORM private.%I(%s);
END;
$b$;
$f$,
      v_name, v_args, v_name, v_args_call
    );
  ELSIF v_result LIKE 'TABLE(%' OR v_result LIKE 'SETOF %' THEN
    v_sql := format(
      $f$
CREATE OR REPLACE FUNCTION public.%I(%s)
RETURNS %s
LANGUAGE sql
SECURITY INVOKER
SET search_path TO public, private
AS $b$
  SELECT * FROM private.%I(%s);
$b$;
$f$,
      v_name, v_args, v_result, v_name, v_args_call
    );
  ELSE
    v_sql := format(
      $f$
CREATE OR REPLACE FUNCTION public.%I(%s)
RETURNS %s
LANGUAGE sql
SECURITY INVOKER
SET search_path TO public, private
AS $b$
  SELECT private.%I(%s);
$b$;
$f$,
      v_name, v_args, v_result, v_name, v_args_call
    );
  END IF;

  EXECUTE v_sql;

  EXECUTE format('REVOKE ALL ON FUNCTION private.%I(%s) FROM PUBLIC', v_name, v_args);
  EXECUTE format('GRANT EXECUTE ON FUNCTION private.%I(%s) TO anon', v_name, v_args);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO anon', v_name, v_args);
END;
$$;

REVOKE ALL ON FUNCTION private.create_public_invoker_wrapper(oid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.create_public_invoker_wrapper(oid) TO postgres, service_role;

COMMENT ON FUNCTION private.create_public_invoker_wrapper(oid) IS
  'Moves a public SECURITY DEFINER RPC to private and creates a public SECURITY INVOKER wrapper (Supabase lint 0028).';
