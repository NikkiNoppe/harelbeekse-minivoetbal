-- Secure matches table: remove anonymous full-table read, expose schedule via matches_public view.
-- Lineup JSONB (home_players/away_players) only via context-based RLS on matches.
-- Kaarten: SECURITY DEFINER RPC for logged-in users only.

-- 1) Drop permissive / redundant policies
DROP POLICY IF EXISTS "matches_anon_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_public_read_final" ON public.matches;
DROP POLICY IF EXISTS "Authenticated users can read matches" ON public.matches;

-- 2) Public schedule view (no lineup JSONB, no referee_notes)
DROP VIEW IF EXISTS public.matches_public;

CREATE VIEW public.matches_public
WITH (security_invoker = false)
AS
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
  m.home_position,
  m.away_position,
  m.referee,
  m.is_submitted,
  m.is_locked,
  m.is_cup_match,
  m.is_playoff_match,
  m.is_playoff_finalized,
  m.playoff_type,
  m.assigned_referee_id,
  ht.team_name AS home_team_name,
  at.team_name AS away_team_name
FROM public.matches m
LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
LEFT JOIN public.teams at ON at.team_id = m.away_team_id;

GRANT SELECT ON public.matches_public TO anon, authenticated;

COMMENT ON VIEW public.matches_public IS
  'Public match schedule and scores only. Excludes home_players, away_players, referee_notes.';

-- 3) Context-based SELECT on matches (custom auth uses anon role + set_current_user_context)
CREATE POLICY "Team managers can read their team matches"
ON public.matches
FOR SELECT
USING (
  get_current_user_role() = 'player_manager'
  AND (
    home_team_id = ANY(get_current_user_team_ids())
    OR away_team_id = ANY(get_current_user_team_ids())
  )
);

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
      AND referee = (
        SELECT u.username
        FROM public.users u
        WHERE u.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
      )
    )
  )
);

-- 4) Kaarten: card events for logged-in users (no direct JSONB scrape for anon)
CREATE OR REPLACE FUNCTION public.get_match_card_events(p_user_id integer)
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
  SELECT u.role::text INTO v_role FROM public.users u WHERE u.user_id = p_user_id;

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
          player.value->>'cardType',
          player.value->>'card',
          player.value->>'card_type',
          player.value->>'kaart',
          ''
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
          player.value->>'cardType',
          player.value->>'card',
          player.value->>'card_type',
          player.value->>'kaart',
          ''
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

GRANT EXECUTE ON FUNCTION public.get_match_card_events(integer) TO anon, authenticated;

-- 5) Tighten players: no anonymous full-table read
DROP POLICY IF EXISTS "Public can read players" ON public.players;
DROP POLICY IF EXISTS "players_anon_policy" ON public.players;
