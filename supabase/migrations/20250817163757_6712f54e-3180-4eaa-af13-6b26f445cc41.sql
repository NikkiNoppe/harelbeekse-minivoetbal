-- SECURITY FIXES - Phase 2: Complete database function hardening

-- Update remaining functions with explicit search_path to prevent injection
CREATE OR REPLACE FUNCTION public.is_player_list_locked()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $function$
DECLARE
  lock_date DATE;
  is_enabled BOOLEAN;
  setting_data JSONB;
BEGIN
  SELECT setting_value, is_active 
  INTO setting_data, is_enabled
  FROM public.application_settings 
  WHERE setting_category = 'player_list_lock' 
  AND setting_name = 'global_lock'
  LIMIT 1;
  
  IF NOT is_enabled OR setting_data IS NULL THEN
    RETURN FALSE;
  END IF;
  
  lock_date := (setting_data->>'lock_from_date')::DATE;
  
  IF lock_date IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN CURRENT_DATE >= lock_date;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_team_balance(team_id_param integer)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  balance DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type = 'deposit' THEN amount
      ELSE -amount
    END
  ), 0)
  INTO balance
  FROM public.team_transactions
  WHERE team_id = team_id_param;
  
  RETURN balance;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_team_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  team_record RECORD;
BEGIN
  FOR team_record IN SELECT team_id FROM public.teams
  LOOP
    UPDATE public.teams 
    SET balance = public.calculate_team_balance(team_record.team_id)
    WHERE team_id = team_record.team_id;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_player_cards()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
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
SET search_path = 'public'
AS $function$
BEGIN
    -- Only update if the match form is being submitted or scores are being updated
    IF (NEW.is_submitted = true AND (OLD.is_submitted = false OR OLD.home_score IS DISTINCT FROM NEW.home_score OR OLD.away_score IS DISTINCT FROM NEW.away_score)) THEN
        PERFORM public.update_competition_standings();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_competition_standings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    match_record RECORD;
    team_record RECORD;
BEGIN
    -- Clear existing standings (with proper WHERE clause)
    DELETE FROM public.competition_standings WHERE true;
    
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

CREATE OR REPLACE FUNCTION public.update_player_cards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    match_record RECORD;
    player_record RECORD;
BEGIN
    -- Reset alle kaarten eerst (with proper WHERE clause)
    UPDATE public.players SET yellow_cards = 0, red_cards = 0 WHERE true;
    
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
                -- Check if player still exists before updating
                IF EXISTS (SELECT 1 FROM public.players WHERE player_id = player_record.player_id) THEN
                    IF player_record.card_type = 'yellow' THEN
                        UPDATE public.players 
                        SET yellow_cards = yellow_cards + 1 
                        WHERE player_id = player_record.player_id;
                    ELSIF player_record.card_type = 'red' THEN
                        UPDATE public.players 
                        SET red_cards = red_cards + 1 
                        WHERE player_id = player_record.player_id;
                    END IF;
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
                -- Check if player still exists before updating
                IF EXISTS (SELECT 1 FROM public.players WHERE player_id = player_record.player_id) THEN
                    IF player_record.card_type = 'yellow' THEN
                        UPDATE public.players 
                        SET yellow_cards = yellow_cards + 1 
                        WHERE player_id = player_record.player_id;
                    ELSIF player_record.card_type = 'red' THEN
                        UPDATE public.players 
                        SET red_cards = red_cards + 1 
                        WHERE player_id = player_record.player_id;
                    END IF;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$function$;