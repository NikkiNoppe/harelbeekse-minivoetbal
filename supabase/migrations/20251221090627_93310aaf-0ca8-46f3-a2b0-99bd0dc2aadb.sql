-- Create SECURITY DEFINER function to check player access in match context
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
    has_match_access boolean := false;
BEGIN
    -- Get current user context
    user_role := get_current_user_role();
    user_id := NULLIF(current_setting('app.current_user_id', true), '')::integer;
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
    IF user_role = 'referee' THEN
        SELECT EXISTS (
            SELECT 1 FROM matches m
            WHERE m.assigned_referee_id = user_id
            AND (m.home_team_id = player_team_id OR m.away_team_id = player_team_id)
            AND m.is_submitted = false
        ) INTO has_match_access;
        
        RETURN has_match_access;
    END IF;
    
    -- Default: no access
    RETURN false;
END;
$$;

-- Add RLS policy for match context player access
CREATE POLICY "Match participants can read relevant players"
ON public.players
FOR SELECT
USING (public.can_read_player_for_match(team_id));