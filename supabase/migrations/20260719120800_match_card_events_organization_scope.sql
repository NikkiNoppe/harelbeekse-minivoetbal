-- get_match_card_events: alleen wedstrijden van actieve organization_id.

CREATE OR REPLACE FUNCTION private.get_match_card_events(p_session_token uuid)
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
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_org_id integer;
  m record;
  player jsonb;
  raw_card text;
  pid integer;
  pname text;
  tname text;
BEGIN
  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role = '' OR v_org_id IS NULL THEN
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
    WHERE mt.organization_id = v_org_id
      AND (mt.home_players IS NOT NULL OR mt.away_players IS NOT NULL)
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
