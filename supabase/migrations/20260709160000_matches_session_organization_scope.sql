-- Wedstrijden: altijd scopen op actieve organization_id (SuperAdmin via acting_organization_id).
-- Fix: get_matches_for_forms omzeilde org-filter voor superadmin (user_id = -1) en niet-admin rollen.

UPDATE public.matches m
SET organization_id = ht.organization_id
FROM public.teams ht
WHERE m.home_team_id = ht.team_id
  AND m.organization_id IS DISTINCT FROM ht.organization_id;

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
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_username text;
  v_team_ids integer[];
  v_org_id integer;
  v_team_ids_text text;
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  SELECT s.user_id, s.role, s.username, s.team_ids, s.organization_id
  INTO v_user_id, v_role, v_username, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role = '' OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  v_team_ids_text := array_to_string(v_team_ids, ',');

  PERFORM public.apply_app_user_context(
    v_role,
    v_user_id,
    COALESCE(v_team_ids_text, ''),
    COALESCE(v_username, ''),
    v_org_id
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
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  WHERE m.organization_id = v_org_id
  AND (
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

CREATE OR REPLACE FUNCTION public.get_matches_for_session(
  p_session_token uuid,
  p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS SETOF public.matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_team_ids integer[];
  v_org_id integer;
BEGIN
  SELECT s.role, s.team_ids, s.organization_id
  INTO v_role, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT m.*
  FROM public.matches m
  WHERE m.organization_id = v_org_id
    AND (NOT (p_filters ? 'is_cup_match') OR m.is_cup_match = (p_filters->>'is_cup_match')::boolean)
    AND (NOT (p_filters ? 'match_id') OR m.match_id = (p_filters->>'match_id')::integer)
    AND (NOT (p_filters ? 'unique_number') OR m.unique_number = p_filters->>'unique_number')
    AND (
      v_role = 'admin'
      OR (v_role IN ('player_manager', 'referee') AND (
        m.home_team_id = ANY(COALESCE(v_team_ids, ARRAY[]::integer[]))
        OR m.away_team_id = ANY(COALESCE(v_team_ids, ARRAY[]::integer[]))
      ))
    )
  ORDER BY m.match_date;
END;
$$;

REVOKE ALL ON FUNCTION public.get_matches_for_session(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_matches_for_session(uuid, jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_match_for_session(
  p_session_token uuid,
  p_match_id integer,
  p_update_data jsonb
)
RETURNS TABLE(match_id integer, success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
DECLARE
  v_user_id integer;
  v_role text;
  v_username text;
  v_team_ids integer[];
  v_org_id integer;
  v_home_team_id integer;
  v_away_team_id integer;
  v_match_org_id integer;
  v_can_update boolean := false;
  v_is_submitted boolean;
BEGIN
  SELECT s.user_id, s.role, s.username, s.team_ids, s.organization_id
  INTO v_user_id, v_role, v_username, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN QUERY SELECT p_match_id, false, 'Geen actieve sessie'::text;
    RETURN;
  END IF;

  SELECT m.home_team_id, m.away_team_id, m.is_submitted, m.organization_id
  INTO v_home_team_id, v_away_team_id, v_is_submitted, v_match_org_id
  FROM public.matches m
  WHERE m.match_id = p_match_id;

  IF v_home_team_id IS NULL THEN
    RETURN QUERY SELECT p_match_id, false, 'Wedstrijd niet gevonden'::text;
    RETURN;
  END IF;

  IF v_match_org_id IS DISTINCT FROM v_org_id THEN
    RETURN QUERY SELECT p_match_id, false, 'Wedstrijd hoort niet bij deze organisatie'::text;
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    v_can_update := true;
  ELSIF v_role = 'player_manager' THEN
    v_can_update := v_team_ids IS NOT NULL
      AND (v_home_team_id = ANY(v_team_ids) OR v_away_team_id = ANY(v_team_ids));
    IF v_can_update AND v_is_submitted = true THEN
      IF p_update_data ? 'home_players' OR p_update_data ? 'away_players' THEN
        RETURN QUERY SELECT p_match_id, false,
          'Spelerslijst kan niet meer gewijzigd worden na indiening. Contacteer een admin.'::text;
        RETURN;
      END IF;
    END IF;
  ELSIF v_role = 'referee' THEN
    v_can_update := EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.match_id = p_match_id
        AND m.organization_id = v_org_id
        AND (m.assigned_referee_id = v_user_id OR m.referee = v_username)
    );
  END IF;

  IF NOT v_can_update THEN
    RETURN QUERY SELECT p_match_id, false, 'Geen toegang tot deze wedstrijd'::text;
    RETURN;
  END IF;

  IF v_role = 'referee' THEN
    UPDATE public.matches SET
      home_score = CASE WHEN p_update_data ? 'home_score' THEN (p_update_data->>'home_score')::integer ELSE home_score END,
      away_score = CASE WHEN p_update_data ? 'away_score' THEN (p_update_data->>'away_score')::integer ELSE away_score END,
      is_submitted = CASE WHEN p_update_data ? 'is_submitted' THEN (p_update_data->>'is_submitted')::boolean ELSE is_submitted END,
      is_locked = CASE WHEN p_update_data ? 'is_locked' THEN (p_update_data->>'is_locked')::boolean ELSE is_locked END,
      referee = CASE WHEN p_update_data ? 'referee' THEN p_update_data->>'referee' ELSE referee END,
      referee_notes = CASE WHEN p_update_data ? 'referee_notes' THEN p_update_data->>'referee_notes' ELSE referee_notes END,
      home_players = CASE WHEN p_update_data ? 'home_players' THEN (p_update_data->'home_players')::jsonb ELSE home_players END,
      away_players = CASE WHEN p_update_data ? 'away_players' THEN (p_update_data->'away_players')::jsonb ELSE away_players END
    WHERE matches.match_id = p_match_id
      AND matches.organization_id = v_org_id;
    RETURN QUERY SELECT p_match_id, true, 'Wedstrijd succesvol bijgewerkt'::text;
    RETURN;
  END IF;

  UPDATE public.matches SET
    home_score = CASE WHEN p_update_data ? 'home_score' THEN (p_update_data->>'home_score')::integer ELSE home_score END,
    away_score = CASE WHEN p_update_data ? 'away_score' THEN (p_update_data->>'away_score')::integer ELSE away_score END,
    home_players = CASE WHEN p_update_data ? 'home_players' THEN (p_update_data->'home_players')::jsonb ELSE home_players END,
    away_players = CASE WHEN p_update_data ? 'away_players' THEN (p_update_data->'away_players')::jsonb ELSE away_players END,
    is_submitted = CASE WHEN p_update_data ? 'is_submitted' THEN (p_update_data->>'is_submitted')::boolean ELSE is_submitted END,
    is_locked = CASE WHEN p_update_data ? 'is_locked' THEN (p_update_data->>'is_locked')::boolean ELSE is_locked END,
    location = CASE WHEN p_update_data ? 'location' THEN p_update_data->>'location' ELSE location END,
    referee = CASE WHEN p_update_data ? 'referee' THEN p_update_data->>'referee' ELSE referee END,
    referee_notes = CASE WHEN p_update_data ? 'referee_notes' THEN p_update_data->>'referee_notes' ELSE referee_notes END,
    assigned_referee_id = CASE WHEN p_update_data ? 'assigned_referee_id' THEN (p_update_data->>'assigned_referee_id')::integer ELSE assigned_referee_id END,
    match_date = CASE WHEN p_update_data ? 'match_date' THEN (p_update_data->>'match_date')::timestamptz ELSE match_date END,
    speeldag = CASE WHEN p_update_data ? 'speeldag' THEN p_update_data->>'speeldag' ELSE speeldag END
  WHERE matches.match_id = p_match_id
    AND matches.organization_id = v_org_id;

  RETURN QUERY SELECT p_match_id, true, 'Wedstrijd succesvol bijgewerkt'::text;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_match_for_session(uuid, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_match_for_session(uuid, integer, jsonb) TO anon, authenticated;
