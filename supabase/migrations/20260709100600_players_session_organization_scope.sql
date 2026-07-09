-- Spelers: altijd scopen op actieve organization_id (SuperAdmin via acting_organization_id).
-- Zelfde persoon mag in meerdere competities (orgs) als aparte speler-rij.
-- Duplicaatcheck: per team, niet globaal over alle organisaties.

-- Zorg dat organization_id overeenkomt met het team (backfill / drift-fix).
UPDATE public.players p
SET organization_id = t.organization_id
FROM public.teams t
WHERE p.team_id = t.team_id
  AND p.organization_id IS DISTINCT FROM t.organization_id;

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
  v_team_ids integer[];
  v_org_id integer;
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  SELECT s.user_id, s.role, s.team_ids, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    RETURN QUERY
    SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id,
           COALESCE(p.yellow_cards, 0), COALESCE(p.red_cards, 0),
           COALESCE(p.suspended_matches_remaining, 0)
    FROM public.players p
    WHERE p.organization_id = v_org_id
      AND (p_team_id IS NULL OR p.team_id = p_team_id)
    ORDER BY p.last_name, p.first_name;
    RETURN;
  END IF;

  IF v_role = 'player_manager' THEN
    IF v_team_ids IS NULL OR array_length(v_team_ids, 1) IS NULL THEN
      RETURN;
    END IF;

    IF p_team_id IS NOT NULL AND NOT (p_team_id = ANY(v_team_ids)) THEN
      RETURN;
    END IF;

    RETURN QUERY
    SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id,
           COALESCE(p.yellow_cards, 0), COALESCE(p.red_cards, 0),
           COALESCE(p.suspended_matches_remaining, 0)
    FROM public.players p
    INNER JOIN public.teams t ON t.team_id = p.team_id
    WHERE p.team_id = ANY(v_team_ids)
      AND t.organization_id = v_org_id
      AND p.organization_id = v_org_id
      AND (p_team_id IS NULL OR p.team_id = p_team_id)
    ORDER BY p.last_name, p.first_name;
    RETURN;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_player_for_session(
  p_session_token uuid,
  p_first_name character varying,
  p_last_name character varying,
  p_birth_date date,
  p_team_id integer
)
RETURNS TABLE(player_id integer, success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_team_ids integer[];
  v_org_id integer;
  v_team_org_id integer;
  v_new_player_id integer;
BEGIN
  SELECT s.role, s.team_ids, s.organization_id
  INTO v_role, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN QUERY SELECT NULL::integer, false, 'Geen actieve sessie'::text;
    RETURN;
  END IF;

  SELECT t.organization_id
  INTO v_team_org_id
  FROM public.teams t
  WHERE t.team_id = p_team_id;

  IF NOT FOUND OR v_team_org_id IS DISTINCT FROM v_org_id THEN
    RETURN QUERY SELECT NULL::integer, false, 'Team hoort niet bij deze organisatie'::text;
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    NULL;
  ELSIF v_role = 'player_manager' THEN
    IF v_team_ids IS NULL OR NOT (p_team_id = ANY(v_team_ids)) THEN
      RETURN QUERY SELECT NULL::integer, false, 'Geen toegang tot dit team'::text;
      RETURN;
    END IF;
  ELSE
    RETURN QUERY SELECT NULL::integer, false, 'Onvoldoende rechten'::text;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.players p
    WHERE p.team_id = p_team_id
      AND p.first_name = p_first_name
      AND p.last_name = p_last_name
      AND p.birth_date = p_birth_date
  ) THEN
    RETURN QUERY SELECT NULL::integer, false, 'Speler staat al op dit team'::text;
    RETURN;
  END IF;

  INSERT INTO public.players (
    first_name,
    last_name,
    birth_date,
    team_id,
    organization_id
  )
  VALUES (
    p_first_name,
    p_last_name,
    p_birth_date,
    p_team_id,
    v_org_id
  )
  RETURNING public.players.player_id INTO v_new_player_id;

  RETURN QUERY SELECT v_new_player_id, true, 'Speler toegevoegd'::text;
END;
$$;

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
  v_org_id integer;
  v_team_id integer;
BEGIN
  SELECT s.role, s.team_ids, s.organization_id
  INTO v_role, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN QUERY SELECT false, 'Geen actieve sessie'::text;
    RETURN;
  END IF;

  SELECT p.team_id
  INTO v_team_id
  FROM public.players p
  WHERE p.player_id = p_player_id
    AND p.organization_id = v_org_id;

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

  IF EXISTS (
    SELECT 1
    FROM public.players p
    WHERE p.team_id = v_team_id
      AND p.first_name = p_first_name
      AND p.last_name = p_last_name
      AND p.birth_date = p_birth_date
      AND p.player_id <> p_player_id
  ) THEN
    RETURN QUERY SELECT false, 'Speler staat al op dit team'::text;
    RETURN;
  END IF;

  UPDATE public.players
  SET first_name = p_first_name,
      last_name = p_last_name,
      birth_date = p_birth_date
  WHERE player_id = p_player_id
    AND organization_id = v_org_id;

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
  v_org_id integer;
  v_team_id integer;
BEGIN
  SELECT s.role, s.team_ids, s.organization_id
  INTO v_role, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN QUERY SELECT false, 'Geen actieve sessie'::text;
    RETURN;
  END IF;

  SELECT p.team_id
  INTO v_team_id
  FROM public.players p
  WHERE p.player_id = p_player_id
    AND p.organization_id = v_org_id;

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

  DELETE FROM public.players
  WHERE player_id = p_player_id
    AND organization_id = v_org_id;

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
  v_org_id integer;
BEGIN
  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN QUERY SELECT false, 'Alleen admins'::text;
    RETURN;
  END IF;

  UPDATE public.players
  SET suspended_matches_remaining = GREATEST(0, p_suspended_matches_remaining)
  WHERE player_id = p_player_id
    AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Speler niet gevonden'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Schorsing bijgewerkt'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.get_players_for_session(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.insert_player_for_session(uuid, character varying, character varying, date, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_player_for_session(uuid, integer, character varying, character varying, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_player_for_session(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_player_suspension_for_session(uuid, integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_players_for_session(uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_player_for_session(uuid, character varying, character varying, date, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_player_for_session(uuid, integer, character varying, character varying, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_player_for_session(uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_player_suspension_for_session(uuid, integer, integer) TO anon, authenticated;

COMMENT ON FUNCTION public.get_players_for_session(uuid, integer) IS
  'Spelers van actieve tenant. SuperAdmin via acting_organization_id; geen cross-org roster.';

COMMENT ON FUNCTION public.insert_player_for_session(uuid, character varying, character varying, date, integer) IS
  'Voegt speler toe binnen actieve tenant; zelfde persoon mag in andere organisaties opnieuw.';
