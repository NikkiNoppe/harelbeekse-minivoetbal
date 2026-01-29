-- SECURITY DEFINER RPC: Get all users for admin
-- Verifies admin role in database, returns all users with team assignments

CREATE OR REPLACE FUNCTION public.get_all_users_for_admin(
  p_user_id INTEGER
)
RETURNS TABLE(
  user_id INTEGER,
  username VARCHAR,
  email VARCHAR,
  role TEXT,
  team_users JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Fetch role directly from database (not client-provided)
  SELECT u.role::text INTO v_role FROM users u WHERE u.user_id = p_user_id;
  
  -- Only admins may see all users
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    u.user_id,
    u.username,
    u.email,
    u.role::text,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'team_id', tu.team_id,
        'team_name', t.team_name
      ))
      FROM team_users tu
      JOIN teams t ON t.team_id = tu.team_id
      WHERE tu.user_id = u.user_id
      ), '[]'::jsonb
    ) as team_users
  FROM users u
  ORDER BY u.username;
END;
$$;

-- SECURITY DEFINER RPC: Get player cards for admin/player_manager
-- Verifies role in database, returns players with cards info

CREATE OR REPLACE FUNCTION public.get_player_cards_for_admin(
  p_user_id INTEGER
)
RETURNS TABLE(
  player_id INTEGER,
  first_name VARCHAR,
  last_name VARCHAR,
  team_id INTEGER,
  team_name VARCHAR,
  yellow_cards INTEGER,
  red_cards INTEGER,
  suspended_matches_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_team_ids INTEGER[];
BEGIN
  -- Fetch role directly from database
  SELECT u.role::text INTO v_role FROM users u WHERE u.user_id = p_user_id;
  
  -- Admin: can see all players
  IF v_role = 'admin' THEN
    RETURN QUERY
    SELECT p.player_id, p.first_name, p.last_name, p.team_id,
           t.team_name, p.yellow_cards, p.red_cards, p.suspended_matches_remaining
    FROM players p
    LEFT JOIN teams t ON t.team_id = p.team_id
    ORDER BY p.yellow_cards DESC NULLS LAST, p.last_name, p.first_name;
    RETURN;
  END IF;
  
  -- Player manager: only own team(s)
  IF v_role = 'player_manager' THEN
    SELECT array_agg(tu.team_id) INTO v_team_ids 
    FROM team_users tu WHERE tu.user_id = p_user_id;
    
    RETURN QUERY
    SELECT p.player_id, p.first_name, p.last_name, p.team_id,
           t.team_name, p.yellow_cards, p.red_cards, p.suspended_matches_remaining
    FROM players p
    LEFT JOIN teams t ON t.team_id = p.team_id
    WHERE p.team_id = ANY(v_team_ids)
    ORDER BY p.yellow_cards DESC NULLS LAST, p.last_name, p.first_name;
    RETURN;
  END IF;
  
  -- Other roles: no access
  RETURN;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_cards_for_admin(INTEGER) TO anon, authenticated;