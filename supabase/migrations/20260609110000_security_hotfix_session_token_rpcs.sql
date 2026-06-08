-- Hotfix: explicit revokes for set_config escalation + session-token validation on admin RPCs.
-- current_setting() is unreliable with pooled connections; authorize via user_sessions instead.

-- =============================================================================
-- 1) Block client context escalation (explicit role revokes)
-- =============================================================================
REVOKE ALL ON FUNCTION public.set_config(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_config(text, text) TO service_role;

REVOKE ALL ON FUNCTION public.set_current_user_context(integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_user_context(integer, text, text) TO service_role;

-- =============================================================================
-- 2) Session validation helper (no reliance on pooled current_setting for authz)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.resolve_session_role(p_session_token uuid)
RETURNS TABLE(user_id integer, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT us.user_id, 'admin'::text
  FROM public.user_sessions us
  WHERE us.session_id = p_session_token
    AND us.expires_at > now()
    AND us.user_id = -1;

  IF FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT us.user_id, u.role::text
  FROM public.user_sessions us
  JOIN public.users u ON u.user_id = us.user_id
  WHERE us.session_id = p_session_token
    AND us.expires_at > now();
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_session_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_session_role(uuid) TO service_role;

-- =============================================================================
-- 3) Admin RPCs require validated session token
-- =============================================================================
DROP FUNCTION IF EXISTS public.get_all_users_for_admin();
DROP FUNCTION IF EXISTS public.get_all_users_for_admin(integer);

CREATE OR REPLACE FUNCTION public.get_all_users_for_admin(p_session_token uuid)
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
DECLARE
  v_role text;
BEGIN
  SELECT r.role INTO v_role
  FROM public.resolve_session_role(p_session_token) r
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' THEN
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

DROP FUNCTION IF EXISTS public.get_player_cards_for_admin();
DROP FUNCTION IF EXISTS public.get_player_cards_for_admin(integer);

CREATE OR REPLACE FUNCTION public.get_player_cards_for_admin(p_session_token uuid)
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
  v_user_id integer;
  v_team_ids integer[];
BEGIN
  SELECT r.user_id, r.role INTO v_user_id, v_role
  FROM public.resolve_session_role(p_session_token) r
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    RETURN QUERY
    SELECT p.player_id, p.first_name, p.last_name, p.team_id, t.team_name,
           p.yellow_cards, p.red_cards, p.suspended_matches_remaining
    FROM public.players p
    LEFT JOIN public.teams t ON t.team_id = p.team_id
    ORDER BY p.yellow_cards DESC NULLS LAST, p.last_name, p.first_name;
    RETURN;
  END IF;

  IF v_role = 'player_manager' THEN
    SELECT array_agg(tu.team_id ORDER BY tu.team_id) INTO v_team_ids
    FROM public.team_users tu
    WHERE tu.user_id = v_user_id;

    RETURN QUERY
    SELECT p.player_id, p.first_name, p.last_name, p.team_id, t.team_name,
           p.yellow_cards, p.red_cards, p.suspended_matches_remaining
    FROM public.players p
    LEFT JOIN public.teams t ON t.team_id = p.team_id
    WHERE p.team_id = ANY(v_team_ids)
    ORDER BY p.yellow_cards DESC NULLS LAST, p.last_name, p.first_name;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.get_match_card_events();
DROP FUNCTION IF EXISTS public.get_match_card_events(integer);

CREATE OR REPLACE FUNCTION public.get_match_card_events(p_session_token uuid)
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
  SELECT r.role INTO v_role
  FROM public.resolve_session_role(p_session_token) r
  LIMIT 1;

  IF v_role IS NULL OR v_role = '' THEN
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

DROP FUNCTION IF EXISTS public.get_user_team_ids_secure();
DROP FUNCTION IF EXISTS public.get_user_team_ids_secure(integer);

CREATE OR REPLACE FUNCTION public.get_user_team_ids_secure(p_session_token uuid)
RETURNS integer[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id integer;
BEGIN
  SELECT r.user_id INTO v_user_id
  FROM public.resolve_session_role(p_session_token) r
  LIMIT 1;

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

REVOKE ALL ON FUNCTION public.get_all_users_for_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_player_cards_for_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_match_card_events(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_team_ids_secure(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_cards_for_admin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_match_card_events(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_team_ids_secure(uuid) TO anon, authenticated;
