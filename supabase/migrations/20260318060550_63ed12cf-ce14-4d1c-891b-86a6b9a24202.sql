
-- SUPERADMIN SUPPORT: Update SECURITY DEFINER RPCs to support SuperAdmin (user_id = -1)

-- 1. get_players_for_team
CREATE OR REPLACE FUNCTION public.get_players_for_team(p_user_id integer, p_team_id integer DEFAULT NULL::integer)
RETURNS TABLE(player_id integer, first_name character varying, last_name character varying, birth_date date, team_id integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
  v_team_ids INTEGER[];
  v_username TEXT;
BEGIN
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL AND p_user_id = -1 THEN
    v_role := current_setting('app.current_user_role', true);
  END IF;
  SELECT array_agg(tu.team_id) INTO v_team_ids FROM team_users tu WHERE tu.user_id = p_user_id;
  IF v_role = 'admin' THEN
    IF p_team_id IS NULL THEN
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id FROM players p ORDER BY p.last_name, p.first_name;
    ELSE
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id FROM players p WHERE p.team_id = p_team_id ORDER BY p.last_name, p.first_name;
    END IF;
    RETURN;
  END IF;
  IF v_role = 'player_manager' THEN
    IF p_team_id IS NOT NULL AND NOT (p_team_id = ANY(v_team_ids)) THEN RETURN; END IF;
    IF p_team_id IS NULL THEN
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id FROM players p WHERE p.team_id = ANY(v_team_ids) ORDER BY p.last_name, p.first_name;
    ELSE
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id FROM players p WHERE p.team_id = p_team_id ORDER BY p.last_name, p.first_name;
    END IF;
    RETURN;
  END IF;
  IF v_role = 'referee' THEN
    IF p_team_id IS NOT NULL THEN
      SELECT u.username INTO v_username FROM users u WHERE u.user_id = p_user_id;
      IF EXISTS (SELECT 1 FROM matches m WHERE (m.home_team_id = p_team_id OR m.away_team_id = p_team_id) AND (m.assigned_referee_id = p_user_id OR m.referee = v_username)) THEN
        RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id FROM players p WHERE p.team_id = p_team_id ORDER BY p.last_name, p.first_name;
      END IF;
    END IF;
    RETURN;
  END IF;
  RETURN;
END;
$function$;

-- 2. get_all_users_for_admin
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin(p_user_id integer)
RETURNS TABLE(user_id integer, username character varying, email character varying, role text, team_users jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
BEGIN
  SELECT u.role::text INTO v_role FROM users u WHERE u.user_id = p_user_id;
  IF v_role IS NULL AND p_user_id = -1 THEN
    v_role := current_setting('app.current_user_role', true);
  END IF;
  IF v_role IS NULL OR v_role != 'admin' THEN RETURN; END IF;
  RETURN QUERY
  SELECT u.user_id, u.username, u.email, u.role::text,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('team_id', tu.team_id, 'team_name', t.team_name)) FROM team_users tu JOIN teams t ON t.team_id = tu.team_id WHERE tu.user_id = u.user_id), '[]'::jsonb) as team_users
  FROM users u ORDER BY u.username;
END;
$function$;

-- 3. get_player_cards_for_admin
CREATE OR REPLACE FUNCTION public.get_player_cards_for_admin(p_user_id integer)
RETURNS TABLE(player_id integer, first_name character varying, last_name character varying, team_id integer, team_name character varying, yellow_cards integer, red_cards integer, suspended_matches_remaining integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
  v_team_ids INTEGER[];
BEGIN
  SELECT u.role::text INTO v_role FROM users u WHERE u.user_id = p_user_id;
  IF v_role IS NULL AND p_user_id = -1 THEN
    v_role := current_setting('app.current_user_role', true);
  END IF;
  IF v_role = 'admin' THEN
    RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.team_id, t.team_name, p.yellow_cards, p.red_cards, p.suspended_matches_remaining FROM players p LEFT JOIN teams t ON t.team_id = p.team_id ORDER BY p.yellow_cards DESC NULLS LAST, p.last_name, p.first_name;
    RETURN;
  END IF;
  IF v_role = 'player_manager' THEN
    SELECT array_agg(tu.team_id) INTO v_team_ids FROM team_users tu WHERE tu.user_id = p_user_id;
    RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.team_id, t.team_name, p.yellow_cards, p.red_cards, p.suspended_matches_remaining FROM players p LEFT JOIN teams t ON t.team_id = p.team_id WHERE p.team_id = ANY(v_team_ids) ORDER BY p.yellow_cards DESC NULLS LAST, p.last_name, p.first_name;
    RETURN;
  END IF;
  RETURN;
END;
$function$;

-- 4. update_match_with_context
CREATE OR REPLACE FUNCTION public.update_match_with_context(p_user_id integer, p_match_id integer, p_update_data jsonb)
RETURNS TABLE(match_id integer, success boolean, message text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT; v_username TEXT; v_team_ids INTEGER[]; v_home_team_id INTEGER; v_away_team_id INTEGER; v_can_update BOOLEAN := FALSE;
BEGIN
  SELECT role::text, username INTO v_role, v_username FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL AND p_user_id = -1 THEN
    v_role := current_setting('app.current_user_role', true);
    v_username := 'SuperAdmin';
  END IF;
  SELECT array_agg(tu.team_id) INTO v_team_ids FROM team_users tu WHERE tu.user_id = p_user_id;
  SELECT m.home_team_id, m.away_team_id INTO v_home_team_id, v_away_team_id FROM matches m WHERE m.match_id = p_match_id;
  IF v_home_team_id IS NULL THEN RETURN QUERY SELECT p_match_id, FALSE, 'Wedstrijd niet gevonden'::TEXT; RETURN; END IF;
  IF v_role = 'admin' THEN v_can_update := TRUE;
  ELSIF v_role = 'player_manager' AND v_team_ids IS NOT NULL THEN v_can_update := (v_home_team_id = ANY(v_team_ids) OR v_away_team_id = ANY(v_team_ids));
  ELSIF v_role = 'referee' THEN v_can_update := EXISTS (SELECT 1 FROM matches m WHERE m.match_id = p_match_id AND (m.assigned_referee_id = p_user_id OR m.referee = v_username));
  END IF;
  IF NOT v_can_update THEN RETURN QUERY SELECT p_match_id, FALSE, 'Geen toegang tot deze wedstrijd'::TEXT; RETURN; END IF;
  UPDATE matches SET
    home_score = CASE WHEN p_update_data ? 'home_score' THEN (p_update_data->>'home_score')::INTEGER ELSE home_score END,
    away_score = CASE WHEN p_update_data ? 'away_score' THEN (p_update_data->>'away_score')::INTEGER ELSE away_score END,
    home_players = CASE WHEN p_update_data ? 'home_players' THEN (p_update_data->'home_players')::JSONB ELSE home_players END,
    away_players = CASE WHEN p_update_data ? 'away_players' THEN (p_update_data->'away_players')::JSONB ELSE away_players END,
    is_submitted = CASE WHEN p_update_data ? 'is_submitted' THEN (p_update_data->>'is_submitted')::BOOLEAN ELSE is_submitted END,
    is_locked = CASE WHEN p_update_data ? 'is_locked' THEN (p_update_data->>'is_locked')::BOOLEAN ELSE is_locked END,
    location = CASE WHEN p_update_data ? 'location' THEN p_update_data->>'location' ELSE location END,
    referee = CASE WHEN p_update_data ? 'referee' THEN p_update_data->>'referee' ELSE referee END,
    referee_notes = CASE WHEN p_update_data ? 'referee_notes' THEN p_update_data->>'referee_notes' ELSE referee_notes END,
    assigned_referee_id = CASE WHEN p_update_data ? 'assigned_referee_id' THEN (p_update_data->>'assigned_referee_id')::INTEGER ELSE assigned_referee_id END,
    match_date = CASE WHEN p_update_data ? 'match_date' THEN (p_update_data->>'match_date')::TIMESTAMPTZ ELSE match_date END,
    speeldag = CASE WHEN p_update_data ? 'speeldag' THEN p_update_data->>'speeldag' ELSE speeldag END
  WHERE matches.match_id = p_match_id;
  RETURN QUERY SELECT p_match_id, TRUE, 'Wedstrijd succesvol bijgewerkt'::TEXT;
END;
$function$;

-- 5. insert_player_with_context
CREATE OR REPLACE FUNCTION public.insert_player_with_context(p_user_id integer, p_first_name character varying, p_last_name character varying, p_birth_date date, p_team_id integer)
RETURNS TABLE(player_id integer, success boolean, message text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT; v_team_ids INTEGER[]; v_new_player_id INTEGER;
BEGIN
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL AND p_user_id = -1 THEN
    v_role := current_setting('app.current_user_role', true);
  END IF;
  SELECT array_agg(tu.team_id) INTO v_team_ids FROM team_users tu WHERE tu.user_id = p_user_id;
  IF v_role IS NULL THEN RETURN QUERY SELECT NULL::INTEGER, FALSE, 'Gebruiker niet gevonden'::TEXT; RETURN; END IF;
  IF v_role = 'admin' THEN NULL;
  ELSIF v_role = 'player_manager' THEN
    IF v_team_ids IS NULL OR NOT (p_team_id = ANY(v_team_ids)) THEN RETURN QUERY SELECT NULL::INTEGER, FALSE, 'Geen toegang tot dit team'::TEXT; RETURN; END IF;
  ELSE RETURN QUERY SELECT NULL::INTEGER, FALSE, 'Onvoldoende rechten'::TEXT; RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM players WHERE first_name = p_first_name AND last_name = p_last_name AND birth_date = p_birth_date) THEN
    RETURN QUERY SELECT NULL::INTEGER, FALSE, 'Speler bestaat al'::TEXT; RETURN;
  END IF;
  INSERT INTO players (first_name, last_name, birth_date, team_id) VALUES (p_first_name, p_last_name, p_birth_date, p_team_id) RETURNING players.player_id INTO v_new_player_id;
  RETURN QUERY SELECT v_new_player_id, TRUE, 'Speler toegevoegd'::TEXT;
END;
$function$;
