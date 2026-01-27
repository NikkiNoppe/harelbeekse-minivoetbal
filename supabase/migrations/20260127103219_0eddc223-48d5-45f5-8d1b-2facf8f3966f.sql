-- SECURITY DEFINER function for atomic player fetching with built-in authorization
-- This eliminates RLS context loss issues from connection pooling

CREATE OR REPLACE FUNCTION public.get_players_for_team(
  p_user_id INTEGER,
  p_team_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
  player_id INTEGER,
  first_name VARCHAR,
  last_name VARCHAR,
  birth_date DATE,
  team_id INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_team_ids INTEGER[];
BEGIN
  -- 1. Get role directly from database (prevents spoofing)
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  
  -- 2. Get team IDs for this user
  SELECT array_agg(tu.team_id) INTO v_team_ids 
  FROM team_users tu WHERE tu.user_id = p_user_id;
  
  -- 3. Admin: can see all players
  IF v_role = 'admin' THEN
    IF p_team_id IS NULL THEN
      -- All players
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
        FROM players p ORDER BY p.last_name, p.first_name;
    ELSE
      -- Specific team
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
        FROM players p WHERE p.team_id = p_team_id ORDER BY p.last_name, p.first_name;
    END IF;
    RETURN;
  END IF;
  
  -- 4. Player manager: only own team(s)
  IF v_role = 'player_manager' THEN
    IF p_team_id IS NOT NULL AND NOT (p_team_id = ANY(v_team_ids)) THEN
      -- No access to this team
      RETURN;
    END IF;
    
    IF p_team_id IS NULL THEN
      -- All teams of this manager
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
        FROM players p WHERE p.team_id = ANY(v_team_ids) ORDER BY p.last_name, p.first_name;
    ELSE
      -- Specific team (already validated above)
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
        FROM players p WHERE p.team_id = p_team_id ORDER BY p.last_name, p.first_name;
    END IF;
    RETURN;
  END IF;
  
  -- 5. Other roles: no access
  RETURN;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_players_for_team(INTEGER, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.get_players_for_team IS 'Atomic player fetch with built-in authorization. Combines auth check and data retrieval in single transaction to prevent RLS context loss from connection pooling.';