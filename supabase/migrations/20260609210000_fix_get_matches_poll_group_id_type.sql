-- poll_group_id is VARCHAR in matches, not integer — caused playoff tab RPC failure.

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
