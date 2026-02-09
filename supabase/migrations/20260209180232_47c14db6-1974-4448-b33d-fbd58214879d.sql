
CREATE OR REPLACE FUNCTION public.get_players_for_team(p_user_id integer, p_team_id integer DEFAULT NULL::integer)
 RETURNS TABLE(player_id integer, first_name character varying, last_name character varying, birth_date date, team_id integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
  v_team_ids INTEGER[];
  v_username TEXT;
BEGIN
  -- 1. Get role directly from database (prevents spoofing)
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  
  -- 2. Get team IDs for this user
  SELECT array_agg(tu.team_id) INTO v_team_ids 
  FROM team_users tu WHERE tu.user_id = p_user_id;
  
  -- 3. Admin: can see all players
  IF v_role = 'admin' THEN
    IF p_team_id IS NULL THEN
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
        FROM players p ORDER BY p.last_name, p.first_name;
    ELSE
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
        FROM players p WHERE p.team_id = p_team_id ORDER BY p.last_name, p.first_name;
    END IF;
    RETURN;
  END IF;
  
  -- 4. Player manager: only own team(s)
  IF v_role = 'player_manager' THEN
    IF p_team_id IS NOT NULL AND NOT (p_team_id = ANY(v_team_ids)) THEN
      RETURN;
    END IF;
    
    IF p_team_id IS NULL THEN
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
        FROM players p WHERE p.team_id = ANY(v_team_ids) ORDER BY p.last_name, p.first_name;
    ELSE
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
        FROM players p WHERE p.team_id = p_team_id ORDER BY p.last_name, p.first_name;
    END IF;
    RETURN;
  END IF;
  
  -- 5. Referee: can see players for teams in their assigned matches
  IF v_role = 'referee' THEN
    IF p_team_id IS NOT NULL THEN
      -- Get referee username for matching
      SELECT u.username INTO v_username FROM users u WHERE u.user_id = p_user_id;
      
      -- Check if referee is assigned to any match involving this team
      IF EXISTS (
        SELECT 1 FROM matches m
        WHERE (m.home_team_id = p_team_id OR m.away_team_id = p_team_id)
        AND (
          m.assigned_referee_id = p_user_id
          OR m.referee = v_username
        )
      ) THEN
        RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
          FROM players p WHERE p.team_id = p_team_id ORDER BY p.last_name, p.first_name;
      END IF;
    END IF;
    RETURN;
  END IF;
  
  -- 6. Other roles: no access
  RETURN;
END;
$function$;
