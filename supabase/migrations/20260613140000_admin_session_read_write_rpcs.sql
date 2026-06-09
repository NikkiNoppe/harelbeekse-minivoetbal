-- Admin session RPCs: player/team writes, poll reads, extended scheids schedule.

-- Extend get_players_for_session with card counts for admin stats
DROP FUNCTION IF EXISTS public.get_players_for_session(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_players_for_session(
  p_session_token uuid,
  p_team_id integer DEFAULT NULL
)
RETURNS TABLE(
  player_id integer,
  first_name character varying,
  last_name character varying,
  birth_date date,
  team_id integer,
  yellow_cards integer,
  red_cards integer,
  suspended_matches_remaining integer
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
BEGIN
  SELECT s.user_id, s.role, s.username, s.team_ids
  INTO v_user_id, v_role, v_username, v_team_ids
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    IF p_team_id IS NULL THEN
      RETURN QUERY
      SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id,
             COALESCE(p.yellow_cards, 0), COALESCE(p.red_cards, 0),
             COALESCE(p.suspended_matches_remaining, 0)
      FROM public.players p
      ORDER BY p.last_name, p.first_name;
    ELSE
      RETURN QUERY
      SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id,
             COALESCE(p.yellow_cards, 0), COALESCE(p.red_cards, 0),
             COALESCE(p.suspended_matches_remaining, 0)
      FROM public.players p
      WHERE p.team_id = p_team_id
      ORDER BY p.last_name, p.first_name;
    END IF;
    RETURN;
  END IF;

  IF v_role = 'player_manager' THEN
    IF p_team_id IS NOT NULL AND NOT (p_team_id = ANY(v_team_ids)) THEN
      RETURN;
    END IF;
    IF p_team_id IS NULL THEN
      RETURN QUERY
      SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id,
             COALESCE(p.yellow_cards, 0), COALESCE(p.red_cards, 0),
             COALESCE(p.suspended_matches_remaining, 0)
      FROM public.players p
      WHERE p.team_id = ANY(v_team_ids)
      ORDER BY p.last_name, p.first_name;
    ELSE
      RETURN QUERY
      SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id,
             COALESCE(p.yellow_cards, 0), COALESCE(p.red_cards, 0),
             COALESCE(p.suspended_matches_remaining, 0)
      FROM public.players p
      WHERE p.team_id = p_team_id
      ORDER BY p.last_name, p.first_name;
    END IF;
    RETURN;
  END IF;

  IF v_role = 'referee' AND p_team_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.matches m
      WHERE (m.home_team_id = p_team_id OR m.away_team_id = p_team_id)
        AND (m.assigned_referee_id = v_user_id OR m.referee = v_username)
    ) THEN
      RETURN QUERY
      SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id,
             COALESCE(p.yellow_cards, 0), COALESCE(p.red_cards, 0),
             COALESCE(p.suspended_matches_remaining, 0)
      FROM public.players p
      WHERE p.team_id = p_team_id
      ORDER BY p.last_name, p.first_name;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_players_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_players_for_session(uuid, integer) TO anon, authenticated;

-- =============================================================================
-- update_player_for_session / delete_player_for_session / update_player_suspension
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_player_for_session(
  p_session_token uuid,
  p_player_id integer,
  p_first_name character varying,
  p_last_name character varying,
  p_birth_date date
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_team_ids integer[];
  v_team_id integer;
BEGIN
  SELECT s.role, s.team_ids INTO v_role, v_team_ids
  FROM private.resolve_app_session(p_session_token) s LIMIT 1;

  IF v_role IS NULL THEN
    RETURN QUERY SELECT false, 'Geen actieve sessie'::text;
    RETURN;
  END IF;

  SELECT p.team_id INTO v_team_id FROM public.players p WHERE p.player_id = p_player_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Speler niet gevonden'::text;
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    NULL;
  ELSIF v_role = 'player_manager' THEN
    IF v_team_ids IS NULL OR NOT (v_team_id = ANY(v_team_ids)) THEN
      RETURN QUERY SELECT false, 'Geen toegang tot deze speler'::text;
      RETURN;
    END IF;
  ELSE
    RETURN QUERY SELECT false, 'Onvoldoende rechten'::text;
    RETURN;
  END IF;

  UPDATE public.players
  SET first_name = p_first_name, last_name = p_last_name, birth_date = p_birth_date
  WHERE player_id = p_player_id;

  RETURN QUERY SELECT true, 'Speler bijgewerkt'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_player_for_session(
  p_session_token uuid,
  p_player_id integer
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_team_ids integer[];
  v_team_id integer;
BEGIN
  SELECT s.role, s.team_ids INTO v_role, v_team_ids
  FROM private.resolve_app_session(p_session_token) s LIMIT 1;

  IF v_role IS NULL THEN
    RETURN QUERY SELECT false, 'Geen actieve sessie'::text;
    RETURN;
  END IF;

  SELECT p.team_id INTO v_team_id FROM public.players p WHERE p.player_id = p_player_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Speler niet gevonden'::text;
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    NULL;
  ELSIF v_role = 'player_manager' THEN
    IF v_team_ids IS NULL OR NOT (v_team_id = ANY(v_team_ids)) THEN
      RETURN QUERY SELECT false, 'Geen toegang tot deze speler'::text;
      RETURN;
    END IF;
  ELSE
    RETURN QUERY SELECT false, 'Onvoldoende rechten'::text;
    RETURN;
  END IF;

  DELETE FROM public.players WHERE player_id = p_player_id;
  RETURN QUERY SELECT true, 'Speler verwijderd'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_player_suspension_for_session(
  p_session_token uuid,
  p_player_id integer,
  p_suspended_matches_remaining integer
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT s.role INTO v_role FROM private.resolve_app_session(p_session_token) s LIMIT 1;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN QUERY SELECT false, 'Alleen admins'::text;
    RETURN;
  END IF;

  UPDATE public.players
  SET suspended_matches_remaining = GREATEST(0, p_suspended_matches_remaining)
  WHERE player_id = p_player_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Speler niet gevonden'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Schorsing bijgewerkt'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.update_player_for_session(uuid, integer, character varying, character varying, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_player_for_session(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_player_suspension_for_session(uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_player_for_session(uuid, integer, character varying, character varying, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_player_for_session(uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_player_suspension_for_session(uuid, integer, integer) TO anon, authenticated;

-- =============================================================================
-- Team CRUD for admin
-- =============================================================================
CREATE OR REPLACE FUNCTION public.insert_team_for_session(
  p_session_token uuid,
  p_team_data jsonb
)
RETURNS TABLE(team_id integer, success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_new_id integer;
BEGIN
  SELECT s.role INTO v_role FROM private.resolve_app_session(p_session_token) s LIMIT 1;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN QUERY SELECT NULL::integer, false, 'Alleen admins'::text;
    RETURN;
  END IF;

  INSERT INTO public.teams (
    team_name, contact_person, contact_phone, contact_email, club_colors, preferred_play_moments
  )
  VALUES (
    (p_team_data->>'team_name')::varchar,
    NULLIF(p_team_data->>'contact_person', ''),
    NULLIF(p_team_data->>'contact_phone', ''),
    NULLIF(p_team_data->>'contact_email', ''),
    NULLIF(p_team_data->>'club_colors', ''),
    CASE WHEN p_team_data ? 'preferred_play_moments' THEN p_team_data->'preferred_play_moments' ELSE NULL END
  )
  RETURNING public.teams.team_id INTO v_new_id;

  RETURN QUERY SELECT v_new_id, true, 'Team toegevoegd'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_team_for_session(
  p_session_token uuid,
  p_team_id integer,
  p_team_data jsonb
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT s.role INTO v_role FROM private.resolve_app_session(p_session_token) s LIMIT 1;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN QUERY SELECT false, 'Alleen admins'::text;
    RETURN;
  END IF;

  UPDATE public.teams SET
    team_name = COALESCE((p_team_data->>'team_name')::varchar, team_name),
    contact_person = CASE WHEN p_team_data ? 'contact_person' THEN NULLIF(p_team_data->>'contact_person', '') ELSE contact_person END,
    contact_phone = CASE WHEN p_team_data ? 'contact_phone' THEN NULLIF(p_team_data->>'contact_phone', '') ELSE contact_phone END,
    contact_email = CASE WHEN p_team_data ? 'contact_email' THEN NULLIF(p_team_data->>'contact_email', '') ELSE contact_email END,
    club_colors = CASE WHEN p_team_data ? 'club_colors' THEN NULLIF(p_team_data->>'club_colors', '') ELSE club_colors END,
    preferred_play_moments = CASE WHEN p_team_data ? 'preferred_play_moments' THEN p_team_data->'preferred_play_moments' ELSE preferred_play_moments END
  WHERE team_id = p_team_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Team niet gevonden'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Team bijgewerkt'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_team_for_session(
  p_session_token uuid,
  p_team_id integer
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT s.role INTO v_role FROM private.resolve_app_session(p_session_token) s LIMIT 1;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN QUERY SELECT false, 'Alleen admins'::text;
    RETURN;
  END IF;

  DELETE FROM public.teams WHERE team_id = p_team_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Team niet gevonden'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Team verwijderd'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.insert_team_for_session(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_team_for_session(uuid, integer, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_team_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_team_for_session(uuid, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_team_for_session(uuid, integer, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_team_for_session(uuid, integer) TO anon, authenticated;

-- =============================================================================
-- Poll reads for scheids admin
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_monthly_polls_for_session(p_session_token uuid)
RETURNS TABLE(
  id integer,
  poll_month text,
  deadline timestamptz,
  status text,
  created_by integer,
  created_at timestamptz,
  updated_at timestamptz,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT s.role INTO v_role FROM private.resolve_app_session(p_session_token) s LIMIT 1;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    mp.id,
    mp.poll_month::text,
    mp.deadline,
    mp.status::text,
    mp.created_by,
    mp.created_at,
    mp.updated_at,
    mp.notes::text
  FROM public.monthly_polls mp
  ORDER BY mp.poll_month DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_poll_match_dates_for_session(
  p_session_token uuid,
  p_poll_month text
)
RETURNS TABLE(match_date date, location text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_poll_id integer;
BEGIN
  SELECT s.role INTO v_role FROM private.resolve_app_session(p_session_token) s LIMIT 1;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN;
  END IF;

  SELECT mp.id INTO v_poll_id FROM public.monthly_polls mp WHERE mp.poll_month = p_poll_month LIMIT 1;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT pmd.match_date::date, pmd.location::text
  FROM public.poll_match_dates pmd
  WHERE pmd.poll_id = v_poll_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_monthly_polls_for_session(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_poll_match_dates_for_session(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_monthly_polls_for_session(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_poll_match_dates_for_session(uuid, text) TO anon, authenticated;

-- =============================================================================
-- Extend scheids schedule with poll_group_id + referee
-- =============================================================================
DROP FUNCTION IF EXISTS public.get_scheids_schedule_for_session(uuid, text);

CREATE OR REPLACE FUNCTION public.get_scheids_schedule_for_session(
  p_session_token uuid,
  p_month text
)
RETURNS TABLE(
  match_id integer,
  match_date timestamptz,
  location text,
  home_team_id integer,
  away_team_id integer,
  home_team_name text,
  away_team_name text,
  assigned_referee_id integer,
  poll_group_id text,
  referee text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_year integer;
  v_month_num integer;
  v_next_month text;
BEGIN
  IF p_month IS NULL OR p_month !~ '^\d{4}-\d{2}$' THEN
    RETURN;
  END IF;

  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role NOT IN ('admin', 'referee') THEN
    RETURN;
  END IF;

  v_year := split_part(p_month, '-', 1)::integer;
  v_month_num := split_part(p_month, '-', 2)::integer;
  v_next_month := CASE
    WHEN v_month_num = 12 THEN (v_year + 1)::text || '-01'
    ELSE v_year::text || '-' || lpad((v_month_num + 1)::text, 2, '0')
  END;

  RETURN QUERY
  SELECT
    m.match_id,
    m.match_date,
    m.location::text,
    m.home_team_id,
    m.away_team_id,
    ht.team_name::text,
    at.team_name::text,
    m.assigned_referee_id,
    m.poll_group_id::text,
    m.referee::text
  FROM public.matches m
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  WHERE m.match_date >= (p_month || '-01')::timestamptz
    AND m.match_date < (v_next_month || '-01')::timestamptz
  ORDER BY m.match_date ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_scheids_schedule_for_session(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_scheids_schedule_for_session(uuid, text) TO anon, authenticated;
