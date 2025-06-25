
-- Remove redundant tables that are no longer needed
DROP TABLE IF EXISTS public.match_form_players CASCADE;
DROP TABLE IF EXISTS public.match_players CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;

-- Create a function to automatically update competition standings from match forms
CREATE OR REPLACE FUNCTION public.update_competition_standings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    match_record RECORD;
    home_team_stats RECORD;
    away_team_stats RECORD;
BEGIN
    -- Clear existing standings
    DELETE FROM public.competition_standings;
    
    -- Loop through all completed matches
    FOR match_record IN 
        SELECT 
            m.match_id,
            m.home_team_id,
            m.away_team_id,
            mf.home_score,
            mf.away_score
        FROM public.matches m
        JOIN public.match_forms mf ON m.match_id = mf.match_id
        WHERE mf.is_submitted = true 
        AND mf.home_score IS NOT NULL 
        AND mf.away_score IS NOT NULL
    LOOP
        -- Update home team stats
        INSERT INTO public.competition_standings (team_id, matches_played, wins, draws, losses, goals_scored, goals_against, goal_difference, points)
        VALUES (
            match_record.home_team_id,
            1,
            CASE WHEN match_record.home_score > match_record.away_score THEN 1 ELSE 0 END,
            CASE WHEN match_record.home_score = match_record.away_score THEN 1 ELSE 0 END,
            CASE WHEN match_record.home_score < match_record.away_score THEN 1 ELSE 0 END,
            match_record.home_score,
            match_record.away_score,
            match_record.home_score - match_record.away_score,
            CASE 
                WHEN match_record.home_score > match_record.away_score THEN 3
                WHEN match_record.home_score = match_record.away_score THEN 1
                ELSE 0
            END
        )
        ON CONFLICT (team_id) DO UPDATE SET
            matches_played = competition_standings.matches_played + 1,
            wins = competition_standings.wins + EXCLUDED.wins,
            draws = competition_standings.draws + EXCLUDED.draws,
            losses = competition_standings.losses + EXCLUDED.losses,
            goals_scored = competition_standings.goals_scored + EXCLUDED.goals_scored,
            goals_against = competition_standings.goals_against + EXCLUDED.goals_against,
            goal_difference = competition_standings.goal_difference + EXCLUDED.goal_difference,
            points = competition_standings.points + EXCLUDED.points;
            
        -- Update away team stats
        INSERT INTO public.competition_standings (team_id, matches_played, wins, draws, losses, goals_scored, goals_against, goal_difference, points)
        VALUES (
            match_record.away_team_id,
            1,
            CASE WHEN match_record.away_score > match_record.home_score THEN 1 ELSE 0 END,
            CASE WHEN match_record.away_score = match_record.home_score THEN 1 ELSE 0 END,
            CASE WHEN match_record.away_score < match_record.home_score THEN 1 ELSE 0 END,
            match_record.away_score,
            match_record.home_score,
            match_record.away_score - match_record.home_score,
            CASE 
                WHEN match_record.away_score > match_record.home_score THEN 3
                WHEN match_record.away_score = match_record.home_score THEN 1
                ELSE 0
            END
        )
        ON CONFLICT (team_id) DO UPDATE SET
            matches_played = competition_standings.matches_played + 1,
            wins = competition_standings.wins + EXCLUDED.wins,
            draws = competition_standings.draws + EXCLUDED.draws,
            losses = competition_standings.losses + EXCLUDED.losses,
            goals_scored = competition_standings.goals_scored + EXCLUDED.goals_scored,
            goals_against = competition_standings.goals_against + EXCLUDED.goals_against,
            goal_difference = competition_standings.goal_difference + EXCLUDED.goal_difference,
            points = competition_standings.points + EXCLUDED.points;
    END LOOP;
END;
$function$;

-- Create a trigger to automatically update standings when match forms are updated
CREATE OR REPLACE FUNCTION public.trigger_update_standings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
    -- Only update if the match form is being submitted or scores are being updated
    IF (NEW.is_submitted = true AND (OLD.is_submitted = false OR OLD.home_score IS DISTINCT FROM NEW.home_score OR OLD.away_score IS DISTINCT FROM NEW.away_score)) THEN
        PERFORM public.update_competition_standings();
    END IF;
    RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS update_standings_trigger ON public.match_forms;
CREATE TRIGGER update_standings_trigger
    AFTER UPDATE ON public.match_forms
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_standings();

-- Add unique constraint to competition_standings to prevent duplicates
ALTER TABLE public.competition_standings 
ADD CONSTRAINT competition_standings_team_id_unique UNIQUE (team_id);
