-- 1. Verbeter de reduce_suspension_after_match trigger
-- Nu wordt schorsing automatisch verlaagd voor ALLE geschorste spelers van beide teams
CREATE OR REPLACE FUNCTION public.reduce_suspension_after_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- When a match is completed, reduce suspension for ALL players with active suspensions
    IF NEW.is_submitted = true AND OLD.is_submitted = false THEN
        
        -- Reduce for ALL home team players with suspended_matches_remaining > 0
        UPDATE public.players 
        SET suspended_matches_remaining = GREATEST(0, suspended_matches_remaining - 1)
        WHERE team_id = NEW.home_team_id 
        AND suspended_matches_remaining > 0;
        
        -- Reduce for ALL away team players with suspended_matches_remaining > 0
        UPDATE public.players 
        SET suspended_matches_remaining = GREATEST(0, suspended_matches_remaining - 1)
        WHERE team_id = NEW.away_team_id 
        AND suspended_matches_remaining > 0;
        
        -- Apply NEW suspensions from this match (red cards, yellow accumulation)
        PERFORM public.apply_suspension_after_match(NEW.match_id);
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 2. Reset Dieter Verbeke's schorsing (player_id 257) - hij heeft al genoeg wedstrijden gemist
UPDATE public.players 
SET suspended_matches_remaining = 0 
WHERE player_id = 257;