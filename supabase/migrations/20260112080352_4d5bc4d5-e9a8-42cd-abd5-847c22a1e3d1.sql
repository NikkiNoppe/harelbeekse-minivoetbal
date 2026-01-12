-- Create SECURITY DEFINER function to update matches with proper context
-- This ensures role/team verification and update happen in the same transaction
CREATE OR REPLACE FUNCTION public.update_match_with_context(
  p_user_id INTEGER,
  p_match_id INTEGER,
  p_update_data JSONB
)
RETURNS TABLE(match_id INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_team_ids INTEGER[];
  v_home_team_id INTEGER;
  v_away_team_id INTEGER;
  v_can_update BOOLEAN := FALSE;
BEGIN
  -- 1. Get the ACTUAL role from the database
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  
  -- 2. Get the user's team IDs
  SELECT array_agg(team_id) INTO v_team_ids FROM team_users WHERE user_id = p_user_id;
  
  -- 3. Get match info
  SELECT m.home_team_id, m.away_team_id 
  INTO v_home_team_id, v_away_team_id
  FROM matches m WHERE m.match_id = p_match_id;
  
  IF v_home_team_id IS NULL THEN
    RETURN QUERY SELECT p_match_id, FALSE, 'Wedstrijd niet gevonden'::TEXT;
    RETURN;
  END IF;
  
  -- 4. Check access rights
  IF v_role = 'admin' THEN
    v_can_update := TRUE;
  ELSIF v_role = 'player_manager' AND v_team_ids IS NOT NULL THEN
    -- Team manager can only update matches where their team plays
    v_can_update := (v_home_team_id = ANY(v_team_ids) OR v_away_team_id = ANY(v_team_ids));
  ELSIF v_role = 'referee' THEN
    -- Referee can update matches assigned to them
    v_can_update := EXISTS (
      SELECT 1 FROM matches m 
      WHERE m.match_id = p_match_id 
      AND m.assigned_referee_id = p_user_id
    );
  END IF;
  
  IF NOT v_can_update THEN
    RETURN QUERY SELECT p_match_id, FALSE, 'Geen toegang tot deze wedstrijd'::TEXT;
    RETURN;
  END IF;
  
  -- 5. Perform the update with all supported fields
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
  
  -- 6. Return success
  RETURN QUERY SELECT p_match_id, TRUE, 'Wedstrijd succesvol bijgewerkt'::TEXT;
END;
$$;