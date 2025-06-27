
-- Stap 1: Voeg speeldag kolom toe aan matches tabel
ALTER TABLE public.matches 
ADD COLUMN speeldag VARCHAR(50);

-- Stap 2: Migreer bestaande matchday data naar de nieuwe kolom
UPDATE public.matches 
SET speeldag = COALESCE(matchdays.name, 'Speeldag ' || matchdays.matchday_id::text)
FROM public.matchdays 
WHERE matches.matchday_id = matchdays.matchday_id;

-- Stap 3: Zet standaard waarde voor matches zonder matchday
UPDATE public.matches 
SET speeldag = 'Te bepalen' 
WHERE speeldag IS NULL;

-- Stap 4: Voeg kaarten kolommen toe aan players tabel
ALTER TABLE public.players 
ADD COLUMN yellow_cards INTEGER DEFAULT 0,
ADD COLUMN red_cards INTEGER DEFAULT 0;

-- Stap 5: Maak functie om kaarten data te aggregeren
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
    
    -- Loop door alle match forms met kaarten data
    FOR match_record IN 
        SELECT match_id, home_players, away_players
        FROM public.match_forms
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

-- Stap 6: Trigger om kaarten automatisch bij te werken
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

-- Stap 7: Voeg trigger toe aan match_forms tabel
DROP TRIGGER IF EXISTS trigger_update_player_cards_on_match_forms ON public.match_forms;
CREATE TRIGGER trigger_update_player_cards_on_match_forms
    AFTER UPDATE ON public.match_forms
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_player_cards();

-- Stap 8: Run de kaarten aggregatie functie voor bestaande data
SELECT public.update_player_cards();

-- Stap 9: Verwijder de ongebruikte tabellen (na data migratie)
DROP TABLE IF EXISTS public.suspensions;
DROP TABLE IF EXISTS public.matchdays CASCADE;

-- Stap 10: Verwijder de matchday_id kolom uit matches
ALTER TABLE public.matches 
DROP COLUMN IF EXISTS matchday_id;
