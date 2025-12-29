-- 1. Nieuwe RLS policy: ingelogde gebruikers kunnen scheidsrechters lezen
CREATE POLICY "Authenticated users can read referees"
ON public.users
FOR SELECT
USING (
  get_current_user_role() IS NOT NULL 
  AND get_current_user_role() != ''
  AND role = 'referee'
);

-- 2. Update can_read_player_for_match: verwijder is_submitted check voor team managers
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
    user_role := get_current_user_role();
    user_id := NULLIF(current_setting('app.current_user_id', true), '')::integer;
    user_username := NULLIF(current_setting('app.current_user_username', true), '');
    user_team_ids := get_current_user_team_ids();
    
    IF user_role IS NULL OR user_role = '' THEN
        RETURN false;
    END IF;
    
    -- Admin: altijd toegang
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Team Manager
    IF user_role = 'player_manager' THEN
        -- Eigen team: altijd toegang
        IF player_team_id = ANY(user_team_ids) THEN
            RETURN true;
        END IF;
        
        -- Tegenpartij spelers voor wedstrijden waarin team deelneemt
        -- is_submitted check VERWIJDERD - team managers moeten tegenpartij info kunnen zien
        SELECT EXISTS (
            SELECT 1 FROM matches m
            WHERE (m.home_team_id = ANY(user_team_ids) OR m.away_team_id = ANY(user_team_ids))
            AND (m.home_team_id = player_team_id OR m.away_team_id = player_team_id)
        ) INTO has_match_access;
        
        RETURN has_match_access;
    END IF;
    
    -- Referee: toegang voor toegewezen wedstrijden
    IF user_role = 'referee' THEN
        SELECT EXISTS (
            SELECT 1 FROM matches m
            WHERE (
                (m.assigned_referee_id IS NOT NULL AND m.assigned_referee_id = user_id)
                OR
                (m.referee IS NOT NULL AND m.referee != '' AND m.referee = user_username)
            )
            AND (m.home_team_id = player_team_id OR m.away_team_id = player_team_id)
        ) INTO has_match_access;
        
        RETURN has_match_access;
    END IF;
    
    RETURN false;
END;
$$;