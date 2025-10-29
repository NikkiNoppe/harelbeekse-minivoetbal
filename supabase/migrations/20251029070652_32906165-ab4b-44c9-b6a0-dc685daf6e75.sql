-- Fix competition standings to exclude cup and playoff matches
-- Update the trigger to prevent cup/playoff matches from affecting standings
CREATE OR REPLACE FUNCTION public.trigger_update_standings()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    -- Only update if the match form is being submitted or scores are being updated
    -- AND it's NOT a cup match AND NOT a playoff match
    IF (NEW.is_submitted = true 
        AND NEW.is_cup_match = false 
        AND NEW.is_playoff_match = false
        AND (OLD.is_submitted = false 
             OR OLD.home_score IS DISTINCT FROM NEW.home_score 
             OR OLD.away_score IS DISTINCT FROM NEW.away_score)) THEN
        PERFORM public.update_competition_standings_optimized();
    END IF;
    RETURN NEW;
END;
$function$;

-- Rebuild the competition standings to remove cup/playoff match points
SELECT public.update_competition_standings_optimized();