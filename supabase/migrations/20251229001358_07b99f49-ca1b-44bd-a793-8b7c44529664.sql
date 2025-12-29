-- Fix referee access to players: allow referees to read players for matches they're assigned to
-- This updates the can_read_player_for_match function to also check the referee username field

-- First, update set_current_user_context to also store username
CREATE OR REPLACE FUNCTION public.set_current_user_context(
  p_user_id integer, 
  p_role text, 
  p_team_ids text DEFAULT ''::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  actual_role text;
  actual_team_ids text;
  actual_username text;
BEGIN
  -- SECURITY: Fetch the ACTUAL role from the database, ignore client-provided p_role
  SELECT role::text, username INTO actual_role, actual_username
  FROM public.users 
  WHERE user_id = p_user_id;
  
  -- If user not found, set empty context (fail-safe)
  IF actual_role IS NULL THEN
    PERFORM set_config('app.current_user_role', '', false);
    PERFORM set_config('app.current_user_id', '', false);
    PERFORM set_config('app.current_user_team_ids', '', false);
    PERFORM set_config('app.current_user_username', '', false);
    RETURN;
  END IF;
  
  -- SECURITY: Fetch the ACTUAL team IDs from the database, ignore client-provided p_team_ids
  SELECT string_agg(team_id::text, ',') INTO actual_team_ids
  FROM public.team_users
  WHERE user_id = p_user_id;
  
  -- Set context with SERVER-VALIDATED values only
  PERFORM set_config('app.current_user_role', actual_role, false);
  PERFORM set_config('app.current_user_id', p_user_id::text, false);
  PERFORM set_config('app.current_user_username', COALESCE(actual_username, ''), false);
  
  IF actual_team_ids IS NOT NULL AND actual_team_ids != '' THEN
    PERFORM set_config('app.current_user_team_ids', actual_team_ids, false);
  ELSE
    PERFORM set_config('app.current_user_team_ids', '', false);
  END IF;
END;
$function$;

-- Now update can_read_player_for_match to check both assigned_referee_id and referee username
CREATE OR REPLACE FUNCTION public.can_read_player_for_match(player_team_id integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_role text;
    user_team_ids integer[];
    user_id integer;
    user_username text;
    has_match_access boolean := false;
BEGIN
    -- Get current user context
    user_role := get_current_user_role();
    user_id := NULLIF(current_setting('app.current_user_id', true), '')::integer;
    user_username := NULLIF(current_setting('app.current_user_username', true), '');
    user_team_ids := get_current_user_team_ids();
    
    -- No role = no access (public/unauthenticated users)
    IF user_role IS NULL OR user_role = '' THEN
        RETURN false;
    END IF;
    
    -- Admin: can read all players
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Team Manager: can read their own team's players
    IF user_role = 'player_manager' THEN
        IF player_team_id = ANY(user_team_ids) THEN
            RETURN true;
        END IF;
        
        -- Also allow reading opponent's players for matches they're involved in
        SELECT EXISTS (
            SELECT 1 FROM matches m
            WHERE (m.home_team_id = ANY(user_team_ids) OR m.away_team_id = ANY(user_team_ids))
            AND (m.home_team_id = player_team_id OR m.away_team_id = player_team_id)
            AND m.is_submitted = false
        ) INTO has_match_access;
        
        RETURN has_match_access;
    END IF;
    
    -- Referee: can read players for matches they're assigned to
    -- Check both assigned_referee_id (user_id) and referee (username) field
    IF user_role = 'referee' THEN
        SELECT EXISTS (
            SELECT 1 FROM matches m
            WHERE (
                -- Check by assigned_referee_id (if set)
                (m.assigned_referee_id IS NOT NULL AND m.assigned_referee_id = user_id)
                OR
                -- Check by referee username (if set and matches)
                (m.referee IS NOT NULL AND m.referee != '' AND m.referee = user_username)
            )
            AND (m.home_team_id = player_team_id OR m.away_team_id = player_team_id)
            -- Remove is_submitted check - referees should be able to read players even after match is submitted
        ) INTO has_match_access;
        
        RETURN has_match_access;
    END IF;
    
    -- Default: no access
    RETURN false;
END;
$$;