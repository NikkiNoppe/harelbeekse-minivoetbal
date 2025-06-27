
-- Remove all dependent triggers first
DROP TRIGGER IF EXISTS trg_create_match_forms ON public.matches;
DROP TRIGGER IF EXISTS create_match_forms_on_insert ON public.matches;
DROP TRIGGER IF EXISTS generate_match_unique_number_trigger ON public.matches;

-- Remove functions with CASCADE to handle all dependencies
DROP FUNCTION IF EXISTS public.create_match_forms_on_insert() CASCADE;
DROP FUNCTION IF EXISTS public.generate_match_unique_number() CASCADE;

-- Step 1: Add all match_forms columns to matches table
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS home_players jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS away_players jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS home_score integer,
ADD COLUMN IF NOT EXISTS away_score integer,
ADD COLUMN IF NOT EXISTS referee text,
ADD COLUMN IF NOT EXISTS referee_notes text,
ADD COLUMN IF NOT EXISTS is_submitted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Step 2: Migrate existing data from match_forms to matches (if match_forms still exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'match_forms') THEN
        UPDATE public.matches 
        SET 
          home_players = mf.home_players,
          away_players = mf.away_players,
          home_score = mf.home_score,
          away_score = mf.away_score,
          referee = mf.referee,
          referee_notes = mf.referee_notes,
          is_submitted = mf.is_submitted,
          is_locked = mf.is_locked,
          created_at = mf.created_at,
          updated_at = mf.updated_at
        FROM public.match_forms mf
        WHERE matches.match_id = mf.match_id;
    END IF;
END $$;

-- Step 3: Update triggers to work with consolidated matches table
DROP TRIGGER IF EXISTS trigger_update_player_cards ON public.match_forms;
DROP TRIGGER IF EXISTS trigger_update_standings ON public.match_forms;

CREATE OR REPLACE FUNCTION public.trigger_update_player_cards()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
    -- Update kaarten als formulier wordt ingediend of kaarten data verandert
    IF (NEW.is_submitted = true AND (
        OLD.is_submitted = false OR 
        OLD.home_players IS DISTINCT FROM NEW.home_players OR 
        OLD.away_players IS DISTINCT FROM NEW.away_players
    )) THEN
        PERFORM public.update_player_cards();
    END IF;
    RETURN NEW;
END;
$function$;

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

-- Add triggers to matches table
CREATE TRIGGER trigger_update_player_cards
    AFTER UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_player_cards();

CREATE TRIGGER trigger_update_standings
    AFTER UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_standings();

-- Step 4: Update the update_player_cards function to work with matches table
CREATE OR REPLACE FUNCTION public.update_player_cards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    match_record RECORD;
    player_record RECORD;
BEGIN
    -- Reset alle kaarten eerst
    UPDATE public.players SET yellow_cards = 0, red_cards = 0;
    
    -- Loop door alle matches met kaarten data
    FOR match_record IN 
        SELECT match_id, home_players, away_players
        FROM public.matches
        WHERE is_submitted = true 
        AND (home_players IS NOT NULL OR away_players IS NOT NULL)
    LOOP
        -- Verwerk home team kaarten
        IF match_record.home_players IS NOT NULL THEN
            FOR player_record IN 
                SELECT 
                    (player->>'playerId')::integer as player_id,
                    player->>'cardType' as card_type
                FROM jsonb_array_elements(match_record.home_players) as player
                WHERE player->>'playerId' IS NOT NULL 
                AND player->>'cardType' IS NOT NULL
                AND player->>'cardType' != 'none'
                AND player->>'cardType' != ''
            LOOP
                IF player_record.card_type = 'yellow' THEN
                    UPDATE public.players 
                    SET yellow_cards = yellow_cards + 1 
                    WHERE player_id = player_record.player_id;
                ELSIF player_record.card_type = 'red' THEN
                    UPDATE public.players 
                    SET red_cards = red_cards + 1 
                    WHERE player_id = player_record.player_id;
                END IF;
            END LOOP;
        END IF;
        
        -- Verwerk away team kaarten
        IF match_record.away_players IS NOT NULL THEN
            FOR player_record IN 
                SELECT 
                    (player->>'playerId')::integer as player_id,
                    player->>'cardType' as card_type
                FROM jsonb_array_elements(match_record.away_players) as player
                WHERE player->>'playerId' IS NOT NULL 
                AND player->>'cardType' IS NOT NULL
                AND player->>'cardType' != 'none'
                AND player->>'cardType' != ''
            LOOP
                IF player_record.card_type = 'yellow' THEN
                    UPDATE public.players 
                    SET yellow_cards = yellow_cards + 1 
                    WHERE player_id = player_record.player_id;
                ELSIF player_record.card_type = 'red' THEN
                    UPDATE public.players 
                    SET red_cards = red_cards + 1 
                    WHERE player_id = player_record.player_id;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$function$;

-- Step 5: Update the update_competition_standings function to work with matches table
CREATE OR REPLACE FUNCTION public.update_competition_standings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    match_record RECORD;
BEGIN
    -- Clear existing standings
    DELETE FROM public.competition_standings;
    
    -- Loop through all completed matches
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

-- Step 6: Finally, drop the match_forms table after data migration (if it exists)
DROP TABLE IF EXISTS public.match_forms;
