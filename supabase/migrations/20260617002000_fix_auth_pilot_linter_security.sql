-- Lint 0028/0029: invoker wrappers + lock internal auth helpers to private.
-- Lint 0003/0006: merge teams JWT pilot into single SELECT policy with (select auth.uid()).

-- ── get_app_user_from_auth: internal only (private) ──
ALTER FUNCTION public.get_app_user_from_auth() SET SCHEMA private;

REVOKE ALL ON FUNCTION private.get_app_user_from_auth() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_app_user_from_auth() TO postgres, service_role;

-- ── establish_app_session_from_supabase_auth: private DEFINER + public INVOKER (authenticated only) ──
ALTER FUNCTION public.establish_app_session_from_supabase_auth() SET SCHEMA private;

CREATE OR REPLACE FUNCTION private.establish_app_session_from_supabase_auth()
RETURNS TABLE(
  session_token uuid,
  user_id integer,
  username character varying,
  email character varying,
  role text,
  team_ids integer[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'private'
AS $$
DECLARE
  v_user record;
  v_token uuid;
  v_team_ids integer[];
  v_team_ids_text text;
BEGIN
  SELECT g.user_id, g.username, g.role, g.team_ids
  INTO v_user
  FROM private.get_app_user_from_auth() g
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_token := gen_random_uuid();
  INSERT INTO public.user_sessions (session_id, user_id, expires_at)
  VALUES (v_token, v_user.user_id, now() + interval '24 hours');

  v_team_ids := COALESCE(v_user.team_ids, ARRAY[]::integer[]);
  v_team_ids_text := COALESCE(array_to_string(v_team_ids, ','), '');

  PERFORM public.apply_app_user_context(
    v_user.role,
    v_user.user_id,
    v_team_ids_text,
    v_user.username::text
  );

  RETURN QUERY
  SELECT
    v_token,
    v_user.user_id,
    v_user.username,
    u.email,
    v_user.role,
    v_team_ids
  FROM public.users u
  WHERE u.user_id = v_user.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.establish_app_session_from_supabase_auth()
RETURNS TABLE(
  session_token uuid,
  user_id integer,
  username character varying,
  email character varying,
  role text,
  team_ids integer[]
)
LANGUAGE sql
SECURITY INVOKER
SET search_path TO public, private
AS $$
  SELECT * FROM private.establish_app_session_from_supabase_auth();
$$;

REVOKE ALL ON FUNCTION private.establish_app_session_from_supabase_auth() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.establish_app_session_from_supabase_auth() TO authenticated, postgres, service_role;

REVOKE ALL ON FUNCTION public.establish_app_session_from_supabase_auth() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.establish_app_session_from_supabase_auth() TO authenticated;

-- ── get_admin_database_backup_for_session: standard session-RPC invoker wrapper ──
SELECT private.create_public_invoker_wrapper(
  to_regprocedure('public.get_admin_database_backup_for_session(uuid)')
);

REVOKE ALL ON FUNCTION public.get_admin_database_backup_for_session(uuid) FROM authenticated;

-- ── teams RLS: merge JWT pilot into one SELECT policy (0003 + 0006) ──
DROP POLICY IF EXISTS teams_select_authenticated_jwt_pilot ON public.teams;
DROP POLICY IF EXISTS "Read teams by role" ON public.teams;

CREATE POLICY "Read teams by role"
ON public.teams
FOR SELECT
TO public
USING (
  (SELECT get_current_user_role()) = 'admin'
  OR (SELECT get_current_user_role()) = 'referee'
  OR (SELECT get_current_user_role()) = 'player_manager'
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_uid = (SELECT auth.uid())
      AND u.role = 'admin'::public.user_role
  )
  OR EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.team_users tu ON tu.user_id = u.user_id
    WHERE u.auth_uid = (SELECT auth.uid())
      AND tu.team_id = teams.team_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_uid = (SELECT auth.uid())
      AND u.role = 'referee'::public.user_role
  )
);

COMMENT ON POLICY "Read teams by role" ON public.teams IS
  'Session GUC roles + optional Supabase Auth JWT (auth_uid) read path; single SELECT policy.';
