-- Phase 2b pilot: Supabase Auth bridge (auth_uid on users, JWT session bridge, teams RLS pilot).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_uid uuid UNIQUE;

COMMENT ON COLUMN public.users.auth_uid IS
  'Optional link to auth.users for Supabase Auth pilot (VITE_USE_SUPABASE_AUTH).';

CREATE OR REPLACE FUNCTION public.get_app_user_from_auth()
RETURNS TABLE(user_id integer, role text, username text, team_ids integer[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    u.user_id,
    u.role::text,
    u.username::text,
    COALESCE(
      array_agg(tu.team_id ORDER BY tu.team_id) FILTER (WHERE tu.team_id IS NOT NULL),
      ARRAY[]::integer[]
    )
  FROM public.users u
  LEFT JOIN public.team_users tu ON tu.user_id = u.user_id
  WHERE u.auth_uid = auth.uid()
  GROUP BY u.user_id, u.role, u.username;
$$;

REVOKE ALL ON FUNCTION public.get_app_user_from_auth() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_app_user_from_auth() TO authenticated;

-- Bridge: Supabase Auth JWT -> legacy user_sessions token (keeps existing session-RPCs working).
CREATE OR REPLACE FUNCTION public.establish_app_session_from_supabase_auth()
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
  FROM public.get_app_user_from_auth() g
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

REVOKE ALL ON FUNCTION public.establish_app_session_from_supabase_auth() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.establish_app_session_from_supabase_auth() TO authenticated;

-- RLS pilot: authenticated JWT read on teams (parallel to session-RPC model; not used by anon client yet).
DROP POLICY IF EXISTS teams_select_authenticated_jwt_pilot ON public.teams;
CREATE POLICY teams_select_authenticated_jwt_pilot
ON public.teams
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_uid = auth.uid()
      AND u.role = 'admin'::public.user_role
  )
  OR EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.team_users tu ON tu.user_id = u.user_id
    WHERE u.auth_uid = auth.uid()
      AND tu.team_id = teams.team_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_uid = auth.uid()
      AND u.role = 'referee'::public.user_role
  )
);

COMMENT ON POLICY teams_select_authenticated_jwt_pilot ON public.teams IS
  'Phase 2b pilot: Supabase Auth JWT read path; primary app still uses session-RPCs via anon.';
