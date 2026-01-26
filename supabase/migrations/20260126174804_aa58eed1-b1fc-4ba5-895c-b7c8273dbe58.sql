-- Insert player met context validatie (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.insert_player_with_context(
  p_user_id INTEGER,
  p_first_name VARCHAR,
  p_last_name VARCHAR,
  p_birth_date DATE,
  p_team_id INTEGER
)
RETURNS TABLE(player_id INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_team_ids INTEGER[];
  v_new_player_id INTEGER;
BEGIN
  -- 1. Haal ACTUELE role uit database
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  
  -- 2. Haal team IDs op
  SELECT array_agg(team_id) INTO v_team_ids 
  FROM team_users WHERE user_id = p_user_id;
  
  -- 3. Check toegangsrechten
  IF v_role IS NULL THEN
    RETURN QUERY SELECT NULL::INTEGER, FALSE, 'Gebruiker niet gevonden'::TEXT;
    RETURN;
  END IF;
  
  IF v_role = 'admin' THEN
    -- Admin mag alle teams
    NULL;
  ELSIF v_role = 'player_manager' THEN
    -- Team manager alleen eigen team
    IF v_team_ids IS NULL OR NOT (p_team_id = ANY(v_team_ids)) THEN
      RETURN QUERY SELECT NULL::INTEGER, FALSE, 'Geen toegang tot dit team'::TEXT;
      RETURN;
    END IF;
  ELSE
    RETURN QUERY SELECT NULL::INTEGER, FALSE, 'Onvoldoende rechten'::TEXT;
    RETURN;
  END IF;
  
  -- 4. Check duplicaat
  IF EXISTS (
    SELECT 1 FROM players 
    WHERE first_name = p_first_name 
    AND last_name = p_last_name 
    AND birth_date = p_birth_date
  ) THEN
    RETURN QUERY SELECT NULL::INTEGER, FALSE, 'Speler bestaat al'::TEXT;
    RETURN;
  END IF;
  
  -- 5. Insert
  INSERT INTO players (first_name, last_name, birth_date, team_id)
  VALUES (p_first_name, p_last_name, p_birth_date, p_team_id)
  RETURNING players.player_id INTO v_new_player_id;
  
  RETURN QUERY SELECT v_new_player_id, TRUE, 'Speler toegevoegd'::TEXT;
END;
$$;