-- Fix wrapper helper: use positional $1..$n (proargnames includes OUT/table cols and breaks calls).

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
  v_nargs int;
  v_sql text;
BEGIN
  SELECT
    p.proname,
    pg_get_function_identity_arguments(p.oid),
    pg_get_function_result(p.oid),
    p.pronamespace,
    CASE
      WHEN p.proargmodes IS NULL THEN p.pronargs
      ELSE (
        SELECT count(*)::int
        FROM unnest(p.proargmodes) AS m(mode)
        WHERE mode IN ('i', 'b')
      )
    END
  INTO v_name, v_args, v_result, v_nsp, v_nargs
  FROM pg_proc p
  WHERE p.oid = p_func_oid;

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Function oid % not found', p_func_oid;
  END IF;

  IF v_nsp = 'public'::regnamespace THEN
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET SCHEMA private', v_name, v_args);
  END IF;

  IF v_nargs > 0 THEN
    SELECT string_agg(format('$%s', g), ', ' ORDER BY g)
    INTO v_args_call
    FROM generate_series(1, v_nargs) AS g;
  ELSE
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
