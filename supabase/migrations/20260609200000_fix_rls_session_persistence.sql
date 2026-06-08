-- Fix wedstrijdformulieren / RLS after session-auth hardening:
-- 1) Persist app.current_* across PostgREST requests (session-level GUC, safe now set_config is revoked)
-- 2) Set app.current_user_username for referee policies
-- 3) Allow teams read for users with valid session context (match form joins)
-- 4) Referee matches policy: no subquery on users (anon has no SELECT on users)

CREATE OR REPLACE FUNCTION public.clear_app_user_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM set_config('app.current_user_role', '', true);
  PERFORM set_config('app.current_user_id', '', true);
  PERFORM set_config('app.current_user_team_ids', '', true);
  PERFORM set_config('app.current_user_username', '', true);
END;
$$;

REVOKE ALL ON FUNCTION public.clear_app_user_context() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_app_user_context() TO service_role;

CREATE OR REPLACE FUNCTION public.apply_app_user_context(
  p_role text,
  p_user_id integer,
  p_team_ids text,
  p_username text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.clear_app_user_context();
  PERFORM set_config('app.current_user_role', COALESCE(p_role, ''), true);
  PERFORM set_config('app.current_user_id', COALESCE(p_user_id::text, ''), true);
  PERFORM set_config('app.current_user_team_ids', COALESCE(p_team_ids, ''), true);
  PERFORM set_config('app.current_user_username', COALESCE(p_username, ''), true);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_app_user_context(text, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_app_user_context(text, integer, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.login_user(
  input_username_or_email text,
  input_password text
)
RETURNS TABLE(
  user_id integer,
  username character varying,
  email character varying,
  role text,
  session_token uuid,
  team_ids integer[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_user record;
  v_token uuid;
  v_team_ids integer[];
  v_team_ids_text text;
BEGIN
  SELECT u.user_id, u.username, u.email, u.role::text
  INTO v_user
  FROM public.users u
  WHERE (u.username = input_username_or_email OR u.email = input_username_or_email)
    AND u.password = crypt(input_password, u.password);

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_token := gen_random_uuid();
  INSERT INTO public.user_sessions (session_id, user_id, expires_at)
  VALUES (v_token, v_user.user_id, now() + interval '24 hours');

  SELECT array_agg(tu.team_id ORDER BY tu.team_id) INTO v_team_ids
  FROM public.team_users tu
  WHERE tu.user_id = v_user.user_id;

  v_team_ids_text := COALESCE(array_to_string(v_team_ids, ','), '');
  PERFORM public.apply_app_user_context(v_user.role, v_user.user_id, v_team_ids_text, v_user.username::text);

  RETURN QUERY
  SELECT v_user.user_id, v_user.username, v_user.email, v_user.role, v_token, v_team_ids;
END;
$$;

CREATE OR REPLACE FUNCTION public.login_super_admin(p_password text)
RETURNS TABLE(session_token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_hash text;
  v_token uuid;
BEGIN
  SELECT s.setting_value #>> '{}' INTO v_hash
  FROM public.application_settings s
  WHERE s.setting_category = 'security'
    AND s.setting_name = 'super_admin_password_hash'
  LIMIT 1;

  IF v_hash IS NULL OR crypt(p_password, v_hash) <> v_hash THEN
    RETURN;
  END IF;

  v_token := gen_random_uuid();
  INSERT INTO public.user_sessions (session_id, user_id, expires_at)
  VALUES (v_token, -1, now() + interval '24 hours');

  PERFORM public.apply_app_user_context('admin', -1, '', 'SuperAdmin');

  RETURN QUERY SELECT v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_user_session(p_session_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_username text;
  v_team_ids text;
BEGIN
  IF p_session_token IS NULL THEN
    PERFORM public.clear_app_user_context();
    RETURN false;
  END IF;

  SELECT us.user_id INTO v_user_id
  FROM public.user_sessions us
  WHERE us.session_id = p_session_token
    AND us.expires_at > now();

  IF NOT FOUND THEN
    PERFORM public.clear_app_user_context();
    RETURN false;
  END IF;

  IF v_user_id = -1 THEN
    PERFORM public.apply_app_user_context('admin', -1, '', 'SuperAdmin');
    RETURN true;
  END IF;

  SELECT u.role::text, u.username::text
  INTO v_role, v_username
  FROM public.users u
  WHERE u.user_id = v_user_id;

  IF v_role IS NULL THEN
    PERFORM public.clear_app_user_context();
    RETURN false;
  END IF;

  SELECT string_agg(tu.team_id::text, ',' ORDER BY tu.team_id) INTO v_team_ids
  FROM public.team_users tu
  WHERE tu.user_id = v_user_id;

  PERFORM public.apply_app_user_context(v_role, v_user_id, COALESCE(v_team_ids, ''), COALESCE(v_username, ''));
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.logout_user(p_session_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.user_sessions WHERE session_id = p_session_token;
  PERFORM public.clear_app_user_context();
END;
$$;

-- Teams: session context users need team_name for match joins (contact cols still column-revoked for anon)
DROP POLICY IF EXISTS "Session context can read teams" ON public.teams;
CREATE POLICY "Session context can read teams"
ON public.teams
FOR SELECT
TO public
USING (
  COALESCE(NULLIF(current_setting('app.current_user_role', true), ''), '') <> ''
);

-- Matches: referee policy without users table subquery
DROP POLICY IF EXISTS "Referees can read assigned matches" ON public.matches;
CREATE POLICY "Referees can read assigned matches"
ON public.matches
FOR SELECT
USING (
  get_current_user_role() = 'referee'
  AND (
    assigned_referee_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
    OR (
      referee IS NOT NULL
      AND referee <> ''
      AND referee = COALESCE(NULLIF(current_setting('app.current_user_username', true), ''), '')
    )
  )
);

-- Wedstrijdformulieren: fetch matches in ONE transaction (PostgREST cannot share GUC across HTTP calls)
DROP FUNCTION IF EXISTS public.get_matches_for_forms(uuid, integer, boolean, text, integer, text);

CREATE OR REPLACE FUNCTION public.get_matches_for_forms(
  p_session_token uuid,
  p_team_id integer DEFAULT 0,
  p_has_elevated_permissions boolean DEFAULT false,
  p_competition_type text DEFAULT NULL,
  p_referee_user_id integer DEFAULT NULL,
  p_referee_username text DEFAULT NULL
)
RETURNS TABLE(
  match_id integer,
  unique_number text,
  match_date timestamptz,
  location text,
  speeldag text,
  home_team_id integer,
  away_team_id integer,
  home_score integer,
  away_score integer,
  referee text,
  referee_notes text,
  is_submitted boolean,
  is_locked boolean,
  home_players jsonb,
  away_players jsonb,
  is_cup_match boolean,
  is_playoff_match boolean,
  assigned_referee_id integer,
  poll_group_id text,
  poll_month text,
  home_team_name text,
  away_team_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_user_id integer;
  v_team_ids text;
  v_username text;
BEGIN
  SELECT r.role, r.user_id INTO v_role, v_user_id
  FROM public.resolve_session_role(p_session_token) r
  LIMIT 1;

  IF v_role IS NULL OR v_role = '' THEN
    RETURN;
  END IF;

  IF v_user_id = -1 THEN
    v_username := 'SuperAdmin';
    v_team_ids := '';
  ELSE
    SELECT u.username::text INTO v_username
    FROM public.users u
    WHERE u.user_id = v_user_id;

    SELECT string_agg(tu.team_id::text, ',' ORDER BY tu.team_id) INTO v_team_ids
    FROM public.team_users tu
    WHERE tu.user_id = v_user_id;
  END IF;

  PERFORM set_config('app.current_user_role', v_role, true);
  PERFORM set_config('app.current_user_id', COALESCE(v_user_id::text, ''), true);
  PERFORM set_config('app.current_user_team_ids', COALESCE(v_team_ids, ''), true);
  PERFORM set_config('app.current_user_username', COALESCE(v_username, ''), true);

  RETURN QUERY
  SELECT
    m.match_id,
    m.unique_number,
    m.match_date,
    m.location,
    m.speeldag,
    m.home_team_id,
    m.away_team_id,
    m.home_score,
    m.away_score,
    m.referee,
    m.referee_notes,
    m.is_submitted,
    m.is_locked,
    m.home_players,
    m.away_players,
    m.is_cup_match,
    m.is_playoff_match,
    m.assigned_referee_id,
    m.poll_group_id::text,
    m.poll_month,
    ht.team_name AS home_team_name,
    at.team_name AS away_team_name
  FROM public.matches m
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  WHERE (
    CASE
      WHEN p_referee_user_id IS NOT NULL THEN
        m.assigned_referee_id = p_referee_user_id
        OR m.referee = COALESCE(p_referee_username, '')
        OR m.referee IS NULL
      WHEN p_has_elevated_permissions THEN true
      WHEN p_team_id > 0 THEN
        m.home_team_id = p_team_id OR m.away_team_id = p_team_id
      ELSE false
    END
  )
  AND (
      p_competition_type IS NULL
      OR (p_competition_type = 'cup' AND m.is_cup_match IS TRUE)
      OR (p_competition_type = 'playoff' AND m.is_playoff_match IS TRUE)
      OR (
        p_competition_type = 'league'
        AND COALESCE(m.is_cup_match, false) IS NOT TRUE
        AND COALESCE(m.is_playoff_match, false) IS NOT TRUE
      )
    )
  ORDER BY m.match_date ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_matches_for_forms(uuid, integer, boolean, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_matches_for_forms(uuid, integer, boolean, text, integer, text) TO anon, authenticated;
