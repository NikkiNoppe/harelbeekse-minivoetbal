CREATE OR REPLACE FUNCTION public.update_match_with_context(p_user_id integer, p_match_id integer, p_update_data jsonb)
 RETURNS TABLE(match_id integer, success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT; v_username TEXT; v_team_ids INTEGER[]; v_home_team_id INTEGER; v_away_team_id INTEGER; v_can_update BOOLEAN := FALSE;
  v_is_submitted BOOLEAN; v_old_home_players JSONB; v_old_away_players JSONB;
BEGIN
  SELECT role::text, username INTO v_role, v_username FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL AND p_user_id = -1 THEN
    v_role := current_setting('app.current_user_role', true);
    v_username := 'SuperAdmin';
  END IF;
  
  PERFORM set_config('app.current_user_role', COALESCE(v_role, ''), true);
  PERFORM set_config('app.current_user_id', p_user_id::text, true);
  
  SELECT array_agg(tu.team_id) INTO v_team_ids FROM team_users tu WHERE tu.user_id = p_user_id;
  SELECT m.home_team_id, m.away_team_id, m.is_submitted, m.home_players, m.away_players 
  INTO v_home_team_id, v_away_team_id, v_is_submitted, v_old_home_players, v_old_away_players 
  FROM matches m WHERE m.match_id = p_match_id;
  
  IF v_home_team_id IS NULL THEN RETURN QUERY SELECT p_match_id, FALSE, 'Wedstrijd niet gevonden'::TEXT; RETURN; END IF;
  
  IF v_role = 'admin' THEN v_can_update := TRUE;
  ELSIF v_role = 'player_manager' THEN 
    v_can_update := v_team_ids IS NOT NULL AND (v_home_team_id = ANY(v_team_ids) OR v_away_team_id = ANY(v_team_ids));
    IF v_can_update AND v_is_submitted = TRUE THEN
      IF p_update_data ? 'home_players' OR p_update_data ? 'away_players' THEN
        RETURN QUERY SELECT p_match_id, FALSE, 'Spelerslijst kan niet meer gewijzigd worden na indiening. Contacteer een admin.'::TEXT; RETURN;
      END IF;
    END IF;
  ELSIF v_role = 'referee' THEN 
    v_can_update := EXISTS (SELECT 1 FROM matches m WHERE m.match_id = p_match_id AND (m.assigned_referee_id = p_user_id OR m.referee = v_username));
  END IF;
  
  IF NOT v_can_update THEN RETURN QUERY SELECT p_match_id, FALSE, 'Geen toegang tot deze wedstrijd'::TEXT; RETURN; END IF;

  -- For referees: allow player data updates (prevent_player_data_wipe trigger protects against wiping existing data)
  IF v_role = 'referee' THEN
    UPDATE matches SET
      home_score = CASE WHEN p_update_data ? 'home_score' THEN (p_update_data->>'home_score')::INTEGER ELSE home_score END,
      away_score = CASE WHEN p_update_data ? 'away_score' THEN (p_update_data->>'away_score')::INTEGER ELSE away_score END,
      is_submitted = CASE WHEN p_update_data ? 'is_submitted' THEN (p_update_data->>'is_submitted')::BOOLEAN ELSE is_submitted END,
      is_locked = CASE WHEN p_update_data ? 'is_locked' THEN (p_update_data->>'is_locked')::BOOLEAN ELSE is_locked END,
      referee = CASE WHEN p_update_data ? 'referee' THEN p_update_data->>'referee' ELSE referee END,
      referee_notes = CASE WHEN p_update_data ? 'referee_notes' THEN p_update_data->>'referee_notes' ELSE referee_notes END,
      home_players = CASE WHEN p_update_data ? 'home_players' THEN (p_update_data->'home_players')::JSONB ELSE home_players END,
      away_players = CASE WHEN p_update_data ? 'away_players' THEN (p_update_data->'away_players')::JSONB ELSE away_players END
    WHERE matches.match_id = p_match_id;
    RETURN QUERY SELECT p_match_id, TRUE, 'Wedstrijd succesvol bijgewerkt'::TEXT;
    RETURN;
  END IF;

  -- For admins and team managers: full update
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