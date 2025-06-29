
-- Remove the unused 'result' column from matches table
ALTER TABLE public.matches DROP COLUMN IF EXISTS result;

-- Update the update_competition_standings function to include all teams
CREATE OR REPLACE FUNCTION public.update_competition_standings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    match_record RECORD;
    team_record RECORD;
BEGIN
    -- Clear existing standings
    DELETE FROM public.competition_standings;
    
    -- Initialize all teams with zero stats
    FOR team_record IN 
        SELECT team_id FROM public.teams
    LOOP
        INSERT INTO public.competition_standings (
            team_id, matches_played, wins, draws, losses, 
            goals_scored, goals_against, goal_difference, points
        ) VALUES (
            team_record.team_id, 0, 0, 0, 0, 0, 0, 0, 0
        );
    END LOOP;
    
    -- Loop through all completed matches and update stats
    FOR match_record IN 
        SELECT 
            match_id,
            home_team_id,
            away_team_id,
            home_score,
            away_score
        FROM public.matches
        WHERE is_submitted = true 
        AND home_score IS NOT NULL 
        AND away_score IS NOT NULL
    LOOP
        -- Update home team stats
        UPDATE public.competition_standings SET
            matches_played = matches_played + 1,
            wins = wins + CASE WHEN match_record.home_score > match_record.away_score THEN 1 ELSE 0 END,
            draws = draws + CASE WHEN match_record.home_score = match_record.away_score THEN 1 ELSE 0 END,
            losses = losses + CASE WHEN match_record.home_score < match_record.away_score THEN 1 ELSE 0 END,
            goals_scored = goals_scored + match_record.home_score,
            goals_against = goals_against + match_record.away_score,
            goal_difference = goal_difference + (match_record.home_score - match_record.away_score),
            points = points + CASE 
                WHEN match_record.home_score > match_record.away_score THEN 3
                WHEN match_record.home_score = match_record.away_score THEN 1
                ELSE 0
            END
        WHERE team_id = match_record.home_team_id;
            
        -- Update away team stats
        UPDATE public.competition_standings SET
            matches_played = matches_played + 1,
            wins = wins + CASE WHEN match_record.away_score > match_record.home_score THEN 1 ELSE 0 END,
            draws = draws + CASE WHEN match_record.away_score = match_record.home_score THEN 1 ELSE 0 END,
            losses = losses + CASE WHEN match_record.away_score < match_record.home_score THEN 1 ELSE 0 END,
            goals_scored = goals_scored + match_record.away_score,
            goals_against = goals_against + match_record.home_score,
            goal_difference = goal_difference + (match_record.away_score - match_record.home_score),
            points = points + CASE 
                WHEN match_record.away_score > match_record.home_score THEN 3
                WHEN match_record.away_score = match_record.home_score THEN 1
                ELSE 0
            END
        WHERE team_id = match_record.away_team_id;
    END LOOP;
END;
$function$;

-- Trigger the function to update standings with all teams
SELECT public.update_competition_standings();
