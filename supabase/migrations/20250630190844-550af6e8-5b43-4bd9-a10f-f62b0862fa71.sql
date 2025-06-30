
-- First, let's check and update any foreign key references to handle cascading deletes properly
-- Update matches table to handle player deletions in JSON data (this is handled at application level)

-- Remove the is_active column from players table
ALTER TABLE public.players DROP COLUMN IF EXISTS is_active;

-- Add cascade delete behavior for team_id foreign key if it doesn't exist
-- First check if the foreign key constraint exists and recreate it with CASCADE
DO $$
BEGIN
    -- Drop existing foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'players_team_id_fkey' 
        AND table_name = 'players'
    ) THEN
        ALTER TABLE public.players DROP CONSTRAINT players_team_id_fkey;
    END IF;
    
    -- Add the foreign key constraint with CASCADE delete
    ALTER TABLE public.players 
    ADD CONSTRAINT players_team_id_fkey 
    FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;
END $$;

-- Update the update_player_cards function to not filter on is_active since the column no longer exists
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
