-- Create batch suspension check function for improved performance
CREATE OR REPLACE FUNCTION public.check_batch_players_suspended(
  player_ids integer[],
  match_date_param timestamp with time zone
) RETURNS TABLE(player_id integer, is_suspended boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    player_record RECORD;
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
    
    -- Loop through all player IDs and check suspension status
    FOR player_record IN 
        SELECT unnest(player_ids) as pid
    LOOP
        -- Get player's current card counts
        SELECT yellow_cards, red_cards, suspended_matches_remaining
        INTO player_cards
        FROM public.players 
        WHERE public.players.player_id = player_record.pid;
        
        -- Check if player has remaining suspended matches
        IF player_cards.suspended_matches_remaining > 0 THEN
            player_id := player_record.pid;
            is_suspended := true;
            RETURN NEXT;
            CONTINUE;
        END IF;
        
        -- Check for manual suspensions in application_settings
        SELECT COUNT(*) INTO suspension_count
        FROM public.application_settings
        WHERE setting_category = 'manual_suspensions'
        AND setting_name = player_record.pid::text
        AND is_active = true
        AND (setting_value->>'end_date')::timestamp with time zone >= match_date_param;
        
        IF suspension_count > 0 THEN
            player_id := player_record.pid;
            is_suspended := true;
            RETURN NEXT;
        ELSE
            player_id := player_record.pid;
            is_suspended := false;
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$;