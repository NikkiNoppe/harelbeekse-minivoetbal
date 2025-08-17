-- Add suspension management functions and extend existing system

-- Create function to check if a player is suspended for a specific match date
CREATE OR REPLACE FUNCTION public.is_player_suspended(player_id_param integer, match_date_param timestamp with time zone)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    suspension_count integer;
    suspension_rules RECORD;
    player_cards RECORD;
BEGIN
    -- Get current suspension rules
    SELECT setting_value INTO suspension_rules
    FROM public.application_settings 
    WHERE setting_category = 'suspension_rules' 
    AND setting_name = 'default_rules'
    AND is_active = true
    LIMIT 1;
    
    -- Get player's current card counts
    SELECT yellow_cards, red_cards, suspended_matches_remaining
    INTO player_cards
    FROM public.players 
    WHERE player_id = player_id_param;
    
    -- Check if player has remaining suspended matches
    IF player_cards.suspended_matches_remaining > 0 THEN
        RETURN true;
    END IF;
    
    -- Check for manual suspensions in application_settings
    SELECT COUNT(*) INTO suspension_count
    FROM public.application_settings
    WHERE setting_category = 'manual_suspensions'
    AND setting_name = player_id_param::text
    AND is_active = true
    AND (setting_value->>'end_date')::timestamp with time zone >= match_date_param;
    
    IF suspension_count > 0 THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$function$;

-- Create function to apply suspension after match completion
CREATE OR REPLACE FUNCTION public.apply_suspension_after_match(match_id_param integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    match_record RECORD;
    player_record RECORD;
    suspension_rules RECORD;
    yellow_card_threshold integer := 2;
    red_card_suspension integer := 1;
BEGIN
    -- Get match data
    SELECT home_players, away_players, is_submitted
    INTO match_record
    FROM public.matches
    WHERE match_id = match_id_param;
    
    -- Only process if match is submitted
    IF NOT match_record.is_submitted THEN
        RETURN;
    END IF;
    
    -- Get suspension rules
    SELECT setting_value INTO suspension_rules
    FROM public.application_settings 
    WHERE setting_category = 'suspension_rules' 
    AND setting_name = 'default_rules'
    AND is_active = true
    LIMIT 1;
    
    IF suspension_rules IS NOT NULL THEN
        yellow_card_threshold := COALESCE((suspension_rules.setting_value->'yellow_card_rules'->0->>'min_cards')::integer, 2);
        red_card_suspension := COALESCE((suspension_rules.setting_value->'red_card_rules'->>'default_suspension_matches')::integer, 1);
    END IF;
    
    -- Process home team players
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
            -- Apply red card suspension immediately
            IF player_record.card_type = 'red' THEN
                UPDATE public.players 
                SET suspended_matches_remaining = suspended_matches_remaining + red_card_suspension
                WHERE player_id = player_record.player_id;
            END IF;
            
            -- Check for yellow card suspension threshold
            IF player_record.card_type = 'yellow' THEN
                UPDATE public.players 
                SET suspended_matches_remaining = CASE 
                    WHEN yellow_cards >= yellow_card_threshold THEN suspended_matches_remaining + 1
                    ELSE suspended_matches_remaining
                END
                WHERE player_id = player_record.player_id 
                AND yellow_cards >= yellow_card_threshold;
            END IF;
        END LOOP;
    END IF;
    
    -- Process away team players
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
            -- Apply red card suspension immediately
            IF player_record.card_type = 'red' THEN
                UPDATE public.players 
                SET suspended_matches_remaining = suspended_matches_remaining + red_card_suspension
                WHERE player_id = player_record.player_id;
            END IF;
            
            -- Check for yellow card suspension threshold
            IF player_record.card_type = 'yellow' THEN
                UPDATE public.players 
                SET suspended_matches_remaining = CASE 
                    WHEN yellow_cards >= yellow_card_threshold THEN suspended_matches_remaining + 1
                    ELSE suspended_matches_remaining
                END
                WHERE player_id = player_record.player_id 
                AND yellow_cards >= yellow_card_threshold;
            END IF;
        END LOOP;
    END IF;
END;
$function$;

-- Create function to reduce suspension count after match completion
CREATE OR REPLACE FUNCTION public.reduce_suspension_after_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- When a match is completed, reduce suspension counts for players who played
    IF NEW.is_submitted = true AND (OLD.is_submitted = false OR OLD.home_players IS DISTINCT FROM NEW.home_players OR OLD.away_players IS DISTINCT FROM NEW.away_players) THEN
        -- Reduce suspension for home team players who played
        IF NEW.home_players IS NOT NULL THEN
            UPDATE public.players 
            SET suspended_matches_remaining = GREATEST(0, suspended_matches_remaining - 1)
            WHERE player_id IN (
                SELECT (player->>'playerId')::integer
                FROM jsonb_array_elements(NEW.home_players) as player
                WHERE player->>'playerId' IS NOT NULL 
                AND (player->>'playerId')::integer != 0
            ) AND suspended_matches_remaining > 0;
        END IF;
        
        -- Reduce suspension for away team players who played
        IF NEW.away_players IS NOT NULL THEN
            UPDATE public.players 
            SET suspended_matches_remaining = GREATEST(0, suspended_matches_remaining - 1)
            WHERE player_id IN (
                SELECT (player->>'playerId')::integer
                FROM jsonb_array_elements(NEW.away_players) as player
                WHERE player->>'playerId' IS NOT NULL 
                AND (player->>'playerId')::integer != 0
            ) AND suspended_matches_remaining > 0;
        END IF;
        
        -- Apply new suspensions from this match
        PERFORM public.apply_suspension_after_match(NEW.match_id);
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for automatic suspension processing
DROP TRIGGER IF EXISTS trigger_process_suspensions ON public.matches;
CREATE TRIGGER trigger_process_suspensions
    AFTER UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.reduce_suspension_after_match();

-- Insert default suspension rules if they don't exist
INSERT INTO public.application_settings (setting_category, setting_name, setting_value, is_active)
VALUES (
    'suspension_rules',
    'default_rules',
    '{
        "yellow_card_rules": [
            {"min_cards": 2, "max_cards": 99, "suspension_matches": 1}
        ],
        "red_card_rules": {
            "default_suspension_matches": 1,
            "max_suspension_matches": 5,
            "admin_can_modify": true
        },
        "reset_rules": {
            "reset_yellow_cards_after_matches": 10,
            "reset_at_season_end": true
        }
    }'::jsonb,
    true
)
ON CONFLICT DO NOTHING;