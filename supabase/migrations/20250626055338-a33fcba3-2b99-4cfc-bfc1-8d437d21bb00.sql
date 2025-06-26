
-- First, let's check if the trigger already exists and create/update it
DROP TRIGGER IF EXISTS update_standings_trigger ON public.match_forms;

-- Create the trigger function if it doesn't exist or update it
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
CREATE TRIGGER update_standings_trigger
    AFTER UPDATE ON public.match_forms
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_standings();

-- Now manually run the update function to process existing completed matches
SELECT public.update_competition_standings();

-- Add sample teams only if they don't exist already
INSERT INTO public.teams (team_name) 
SELECT 'MVC Sporthalle' 
WHERE NOT EXISTS (SELECT 1 FROM public.teams WHERE team_name = 'MVC Sporthalle');

INSERT INTO public.teams (team_name) 
SELECT 'Café De Gilde' 
WHERE NOT EXISTS (SELECT 1 FROM public.teams WHERE team_name = 'Café De Gilde');

-- Get team IDs for the sample match
DO $$
DECLARE
    mvc_id INTEGER;
    gilde_id INTEGER;
    sample_match_id INTEGER;
    sample_matchday_id INTEGER;
BEGIN
    -- Get team IDs
    SELECT team_id INTO mvc_id FROM public.teams WHERE team_name = 'MVC Sporthalle';
    SELECT team_id INTO gilde_id FROM public.teams WHERE team_name = 'Café De Gilde';
    
    IF mvc_id IS NOT NULL AND gilde_id IS NOT NULL THEN
        -- Insert a sample matchday if it doesn't exist
        SELECT matchday_id INTO sample_matchday_id FROM public.matchdays WHERE name = 'Speeldag 1';
        
        IF sample_matchday_id IS NULL THEN
            INSERT INTO public.matchdays (name, matchday_date) VALUES ('Speeldag 1', CURRENT_DATE - INTERVAL '7 days')
            RETURNING matchday_id INTO sample_matchday_id;
        END IF;
        
        -- Insert the sample match if it doesn't exist
        SELECT match_id INTO sample_match_id FROM public.matches 
        WHERE home_team_id = mvc_id AND away_team_id = gilde_id;
        
        IF sample_match_id IS NULL THEN
            INSERT INTO public.matches (home_team_id, away_team_id, match_date, field_cost, referee_cost, matchday_id)
            VALUES (mvc_id, gilde_id, CURRENT_DATE - INTERVAL '7 days', 50.00, 30.00, sample_matchday_id)
            RETURNING match_id INTO sample_match_id;
        END IF;
        
        -- Update or insert the match form with the score 10-5
        IF sample_match_id IS NOT NULL THEN
            -- Check if match form already exists
            IF EXISTS (SELECT 1 FROM public.match_forms WHERE match_id = sample_match_id) THEN
                UPDATE public.match_forms SET
                    home_score = 10,
                    away_score = 5,
                    is_submitted = true,
                    updated_at = now()
                WHERE match_id = sample_match_id;
            ELSE
                INSERT INTO public.match_forms (match_id, team_id, home_score, away_score, is_submitted, created_at, updated_at, home_players, away_players)
                VALUES (sample_match_id, mvc_id, 10, 5, true, now(), now(), '[]', '[]');
            END IF;
        END IF;
    END IF;
END $$;

-- Run the standings update again to make sure the new match is processed
SELECT public.update_competition_standings();
