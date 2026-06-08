-- Fix wedstrijdformulieren for admins: inline session validation (no resolve_session_role grant chain),
-- use apply_app_user_context, and team names via teams_public.

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
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  -- SuperAdmin session
  SELECT us.user_id INTO v_user_id
  FROM public.user_sessions us
  WHERE us.session_id = p_session_token
    AND us.expires_at > now()
    AND us.user_id = -1
  LIMIT 1;

  IF FOUND THEN
    v_role := 'admin';
    v_username := 'SuperAdmin';
    v_team_ids := '';
  ELSE
    SELECT us.user_id, u.role::text, u.username::text
    INTO v_user_id, v_role, v_username
    FROM public.user_sessions us
    JOIN public.users u ON u.user_id = us.user_id
    WHERE us.session_id = p_session_token
      AND us.expires_at > now()
    LIMIT 1;

    IF NOT FOUND OR v_role IS NULL OR v_role = '' THEN
      RETURN;
    END IF;

    SELECT string_agg(tu.team_id::text, ',' ORDER BY tu.team_id) INTO v_team_ids
    FROM public.team_users tu
    WHERE tu.user_id = v_user_id;
  END IF;

  PERFORM public.apply_app_user_context(
    v_role,
    v_user_id,
    COALESCE(v_team_ids, ''),
    COALESCE(v_username, '')
  );

  RETURN QUERY
  SELECT
    m.match_id,
    m.unique_number::text,
    m.match_date,
    m.location::text,
    m.speeldag::text,
    m.home_team_id,
    m.away_team_id,
    m.home_score,
    m.away_score,
    m.referee::text,
    m.referee_notes::text,
    m.is_submitted,
    m.is_locked,
    m.home_players,
    m.away_players,
    m.is_cup_match,
    m.is_playoff_match,
    m.assigned_referee_id,
    m.poll_group_id::text,
    m.poll_month::text,
    ht.team_name::text AS home_team_name,
    at.team_name::text AS away_team_name
  FROM public.matches m
  LEFT JOIN public.teams_public ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams_public at ON at.team_id = m.away_team_id
  WHERE (
    CASE
      WHEN p_referee_user_id IS NOT NULL THEN
        m.assigned_referee_id = p_referee_user_id
        OR m.referee = COALESCE(p_referee_username, '')
        OR m.referee IS NULL
      WHEN p_has_elevated_permissions AND v_role IN ('admin', 'referee') THEN true
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

-- Explicit admin SELECT policy (20260607100000 only added team_manager + referee policies)
DROP POLICY IF EXISTS "Admins can read all matches" ON public.matches;
CREATE POLICY "Admins can read all matches"
ON public.matches
FOR SELECT
USING (get_current_user_role() = 'admin');
