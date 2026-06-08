-- Security hardening: session tokens replace client-controlled context escalation.
-- Fixes: set_config / set_current_user_context abuse, caller-supplied p_user_id on admin RPCs,
-- teams PII exposure, password_reset_tokens, GraphQL surface reduction.

-- =============================================================================
-- 1) Session store
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.user_sessions IS
  'Server-issued session tokens. No client policies — only SECURITY DEFINER auth functions.';

-- Super admin password hash (rotate in application_settings after deploy)
DELETE FROM public.application_settings
WHERE setting_category = 'security' AND setting_name = 'super_admin_password_hash';

INSERT INTO public.application_settings (setting_category, setting_name, setting_value)
VALUES (
  'security',
  'super_admin_password_hash',
  to_jsonb(crypt('admin1987', gen_salt('bf'))::text)
);

-- =============================================================================
-- 2) Auth functions (only path to set app.current_* context)
-- =============================================================================
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

  PERFORM set_config('app.current_user_role', v_user.role, false);
  PERFORM set_config('app.current_user_id', v_user.user_id::text, false);
  IF v_team_ids IS NOT NULL THEN
    PERFORM set_config('app.current_user_team_ids', array_to_string(v_team_ids, ','), false);
  ELSE
    PERFORM set_config('app.current_user_team_ids', '', false);
  END IF;

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

  PERFORM set_config('app.current_user_role', 'admin', false);
  PERFORM set_config('app.current_user_id', '-1', false);
  PERFORM set_config('app.current_user_team_ids', '', false);

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
  v_team_ids text;
BEGIN
  IF p_session_token IS NULL THEN
    RETURN false;
  END IF;

  SELECT us.user_id INTO v_user_id
  FROM public.user_sessions us
  WHERE us.session_id = p_session_token
    AND us.expires_at > now();

  IF NOT FOUND THEN
    PERFORM set_config('app.current_user_role', '', false);
    PERFORM set_config('app.current_user_id', '', false);
    PERFORM set_config('app.current_user_team_ids', '', false);
    RETURN false;
  END IF;

  IF v_user_id = -1 THEN
    PERFORM set_config('app.current_user_role', 'admin', false);
    PERFORM set_config('app.current_user_id', '-1', false);
    PERFORM set_config('app.current_user_team_ids', '', false);
    RETURN true;
  END IF;

  SELECT u.role::text INTO v_role
  FROM public.users u
  WHERE u.user_id = v_user_id;

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  SELECT string_agg(tu.team_id::text, ',' ORDER BY tu.team_id) INTO v_team_ids
  FROM public.team_users tu
  WHERE tu.user_id = v_user_id;

  PERFORM set_config('app.current_user_role', v_role, false);
  PERFORM set_config('app.current_user_id', v_user_id::text, false);
  PERFORM set_config('app.current_user_team_ids', COALESCE(v_team_ids, ''), false);
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
  PERFORM set_config('app.current_user_role', '', false);
  PERFORM set_config('app.current_user_id', '', false);
  PERFORM set_config('app.current_user_team_ids', '', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_session(p_session_token uuid)
RETURNS TABLE(is_valid boolean, user_id integer, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
BEGIN
  SELECT us.user_id INTO v_user_id
  FROM public.user_sessions us
  WHERE us.session_id = p_session_token
    AND us.expires_at > now();

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::integer, NULL::text;
    RETURN;
  END IF;

  IF v_user_id = -1 THEN
    RETURN QUERY SELECT true, -1, 'admin'::text;
    RETURN;
  END IF;

  SELECT u.role::text INTO v_role FROM public.users u WHERE u.user_id = v_user_id;
  IF v_role IS NULL THEN
    RETURN QUERY SELECT false, NULL::integer, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_user_id, v_role;
END;
$$;

-- Lock down legacy context escalation paths
REVOKE ALL ON FUNCTION public.set_config(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_config(text, text) TO service_role;

REVOKE ALL ON FUNCTION public.set_current_user_context(integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_current_user_context(integer, text, text) TO service_role;

GRANT EXECUTE ON FUNCTION public.login_user(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_super_admin(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_user_session(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.logout_user(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_session(uuid) TO service_role;

-- =============================================================================
-- 3) Admin RPCs: use restored session context only (no caller-supplied user id)
-- =============================================================================
DROP FUNCTION IF EXISTS public.get_all_users_for_admin(integer);

CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(
  user_id integer,
  username character varying,
  email character varying,
  role text,
  team_users jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF COALESCE(NULLIF(current_setting('app.current_user_role', true), ''), '') <> 'admin' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    u.user_id,
    u.username,
    u.email,
    u.role::text,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object('team_id', tu.team_id, 'team_name', t.team_name))
        FROM public.team_users tu
        JOIN public.teams t ON t.team_id = tu.team_id
        WHERE tu.user_id = u.user_id
      ),
      '[]'::jsonb
    ) AS team_users
  FROM public.users u
  ORDER BY u.username;
END;
$$;

DROP FUNCTION IF EXISTS public.get_player_cards_for_admin(integer);

CREATE OR REPLACE FUNCTION public.get_player_cards_for_admin()
RETURNS TABLE(
  player_id integer,
  first_name character varying,
  last_name character varying,
  team_id integer,
  team_name character varying,
  yellow_cards integer,
  red_cards integer,
  suspended_matches_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_team_ids integer[];
BEGIN
  v_role := COALESCE(NULLIF(current_setting('app.current_user_role', true), ''), '');
  v_team_ids := get_current_user_team_ids();

  IF v_role = 'admin' THEN
    RETURN QUERY
    SELECT p.player_id, p.first_name, p.last_name, p.team_id, t.team_name,
           p.yellow_cards, p.red_cards, p.suspended_matches_remaining
    FROM public.players p
    LEFT JOIN public.teams t ON t.team_id = p.team_id
    ORDER BY p.yellow_cards DESC NULLS LAST, p.last_name, p.first_name;
    RETURN;
  END IF;

  IF v_role = 'player_manager' AND v_team_ids IS NOT NULL THEN
    RETURN QUERY
    SELECT p.player_id, p.first_name, p.last_name, p.team_id, t.team_name,
           p.yellow_cards, p.red_cards, p.suspended_matches_remaining
    FROM public.players p
    LEFT JOIN public.teams t ON t.team_id = p.team_id
    WHERE p.team_id = ANY(v_team_ids)
    ORDER BY p.yellow_cards DESC NULLS LAST, p.last_name, p.first_name;
    RETURN;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.get_match_card_events(integer);

CREATE OR REPLACE FUNCTION public.get_match_card_events()
RETURNS TABLE(
  player_id integer,
  player_name text,
  team_name text,
  card_type text,
  match_id integer,
  match_date timestamptz,
  unique_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  m record;
  player jsonb;
  raw_card text;
  pid integer;
  pname text;
  tname text;
BEGIN
  v_role := COALESCE(NULLIF(current_setting('app.current_user_role', true), ''), '');
  IF v_role = '' THEN
    RETURN;
  END IF;

  FOR m IN
    SELECT
      mt.match_id,
      mt.match_date,
      mt.unique_number,
      mt.home_players,
      mt.away_players,
      ht.team_name AS home_team_name,
      at.team_name AS away_team_name
    FROM public.matches mt
    LEFT JOIN public.teams ht ON ht.team_id = mt.home_team_id
    LEFT JOIN public.teams at ON at.team_id = mt.away_team_id
    WHERE mt.home_players IS NOT NULL OR mt.away_players IS NOT NULL
  LOOP
    IF m.home_players IS NOT NULL AND jsonb_typeof(m.home_players) = 'array' THEN
      FOR player IN SELECT value FROM jsonb_array_elements(m.home_players) AS t(value)
      LOOP
        pid := COALESCE(
          NULLIF(player.value->>'playerId', '')::integer,
          NULLIF(player.value->>'player_id', '')::integer,
          NULLIF(player.value->>'id', '')::integer
        );
        pname := COALESCE(
          NULLIF(player.value->>'playerName', ''),
          NULLIF(player.value->>'name', ''),
          NULLIF(TRIM(CONCAT(player.value->>'firstName', ' ', player.value->>'lastName')), '')
        );
        raw_card := lower(COALESCE(
          player.value->>'cardType', player.value->>'card',
          player.value->>'card_type', player.value->>'kaart', ''
        ));
        tname := COALESCE(m.home_team_name, 'Onbekend');
        IF pid IS NOT NULL AND pname IS NOT NULL AND pname <> '' THEN
          IF raw_card IN ('yellow', 'geel') THEN
            player_id := pid; player_name := pname; team_name := tname;
            card_type := 'yellow'; match_id := m.match_id;
            match_date := m.match_date; unique_number := COALESCE(m.unique_number, '');
            RETURN NEXT;
          ELSIF raw_card IN ('red', 'rood') THEN
            player_id := pid; player_name := pname; team_name := tname;
            card_type := 'red'; match_id := m.match_id;
            match_date := m.match_date; unique_number := COALESCE(m.unique_number, '');
            RETURN NEXT;
          ELSIF raw_card IN ('double_yellow', '2x geel', 'double-yellow') THEN
            player_id := pid; player_name := pname; team_name := tname;
            card_type := 'yellow'; match_id := m.match_id;
            match_date := m.match_date; unique_number := COALESCE(m.unique_number, '');
            RETURN NEXT;
            player_id := pid; player_name := pname; team_name := tname;
            card_type := 'yellow'; match_id := m.match_id;
            match_date := m.match_date; unique_number := COALESCE(m.unique_number, '');
            RETURN NEXT;
          END IF;
        END IF;
      END LOOP;
    END IF;

    IF m.away_players IS NOT NULL AND jsonb_typeof(m.away_players) = 'array' THEN
      FOR player IN SELECT value FROM jsonb_array_elements(m.away_players) AS t(value)
      LOOP
        pid := COALESCE(
          NULLIF(player.value->>'playerId', '')::integer,
          NULLIF(player.value->>'player_id', '')::integer,
          NULLIF(player.value->>'id', '')::integer
        );
        pname := COALESCE(
          NULLIF(player.value->>'playerName', ''),
          NULLIF(player.value->>'name', ''),
          NULLIF(TRIM(CONCAT(player.value->>'firstName', ' ', player.value->>'lastName')), '')
        );
        raw_card := lower(COALESCE(
          player.value->>'cardType', player.value->>'card',
          player.value->>'card_type', player.value->>'kaart', ''
        ));
        tname := COALESCE(m.away_team_name, 'Onbekend');
        IF pid IS NOT NULL AND pname IS NOT NULL AND pname <> '' THEN
          IF raw_card IN ('yellow', 'geel') THEN
            player_id := pid; player_name := pname; team_name := tname;
            card_type := 'yellow'; match_id := m.match_id;
            match_date := m.match_date; unique_number := COALESCE(m.unique_number, '');
            RETURN NEXT;
          ELSIF raw_card IN ('red', 'rood') THEN
            player_id := pid; player_name := pname; team_name := tname;
            card_type := 'red'; match_id := m.match_id;
            match_date := m.match_date; unique_number := COALESCE(m.unique_number, '');
            RETURN NEXT;
          ELSIF raw_card IN ('double_yellow', '2x geel', 'double-yellow') THEN
            player_id := pid; player_name := pname; team_name := tname;
            card_type := 'yellow'; match_id := m.match_id;
            match_date := m.match_date; unique_number := COALESCE(m.unique_number, '');
            RETURN NEXT;
            player_id := pid; player_name := pname; team_name := tname;
            card_type := 'yellow'; match_id := m.match_id;
            match_date := m.match_date; unique_number := COALESCE(m.unique_number, '');
            RETURN NEXT;
          END IF;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_team_ids_secure(integer);

CREATE OR REPLACE FUNCTION public.get_user_team_ids_secure()
RETURNS integer[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id integer;
BEGIN
  v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::integer;
  IF v_user_id IS NULL OR v_user_id < 1 THEN
    RETURN ARRAY[]::integer[];
  END IF;

  RETURN COALESCE(
    array_agg(tu.team_id ORDER BY tu.team_id),
    ARRAY[]::integer[]
  )
  FROM public.team_users tu
  WHERE tu.user_id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_users_for_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_player_cards_for_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_match_card_events() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_team_ids_secure() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_cards_for_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_match_card_events() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_team_ids_secure() TO anon, authenticated;

-- =============================================================================
-- 4) Teams: public view only (no contact PII for anon)
-- =============================================================================
DROP POLICY IF EXISTS "Public can read basic team info" ON public.teams;

DROP VIEW IF EXISTS public.teams_public;
CREATE VIEW public.teams_public
WITH (security_invoker = false)
AS
SELECT team_id, team_name, club_colors
FROM public.teams;

GRANT SELECT ON public.teams_public TO anon, authenticated;

REVOKE SELECT (contact_person, contact_phone, contact_email) ON public.teams FROM anon;

-- =============================================================================
-- 5) password_reset_tokens hardening
-- =============================================================================
DROP POLICY IF EXISTS "Deny client read on password reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Deny client read on password reset tokens"
ON public.password_reset_tokens
AS RESTRICTIVE
FOR SELECT
TO public
USING (false);

-- =============================================================================
-- 6) Reduce GraphQL / direct table exposure
-- =============================================================================
REVOKE SELECT ON public.users FROM anon;
REVOKE SELECT ON public.password_reset_tokens FROM anon;
REVOKE SELECT ON public.user_sessions FROM anon, authenticated;
