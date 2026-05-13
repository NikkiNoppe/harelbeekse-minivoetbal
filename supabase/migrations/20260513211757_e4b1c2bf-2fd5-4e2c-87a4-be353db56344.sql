CREATE OR REPLACE FUNCTION public.update_player_cards()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    match_record RECORD;
    player_record RECORD;
    normalized_card_type TEXT;
BEGIN
    -- Reset alle kaarten (WHERE-clausule vereist door safe-update mode)
    UPDATE public.players SET yellow_cards = 0, red_cards = 0
    WHERE player_id IS NOT NULL;

    FOR match_record IN
        SELECT match_id, home_players, away_players
        FROM public.matches
        WHERE is_submitted = true
        AND (home_players IS NOT NULL OR away_players IS NOT NULL)
    LOOP
        IF match_record.home_players IS NOT NULL THEN
            FOR player_record IN
                SELECT
                    (COALESCE(player->>'playerId', player->>'player_id', player->>'id'))::integer AS player_id,
                    LOWER(COALESCE(player->>'cardType', player->>'card', player->>'card_type', player->>'kaart', 'none')) AS card_type
                FROM jsonb_array_elements(match_record.home_players) AS player
                WHERE COALESCE(player->>'playerId', player->>'player_id', player->>'id') IS NOT NULL
            LOOP
                normalized_card_type := COALESCE(player_record.card_type, 'none');

                IF EXISTS (SELECT 1 FROM public.players WHERE player_id = player_record.player_id) THEN
                    IF normalized_card_type IN ('yellow', 'geel') THEN
                        UPDATE public.players SET yellow_cards = yellow_cards + 1 WHERE player_id = player_record.player_id;
                    ELSIF normalized_card_type IN ('double_yellow', '2x geel', 'double-yellow') THEN
                        UPDATE public.players SET yellow_cards = yellow_cards + 2 WHERE player_id = player_record.player_id;
                    ELSIF normalized_card_type IN ('red', 'rood') THEN
                        UPDATE public.players SET red_cards = red_cards + 1 WHERE player_id = player_record.player_id;
                    END IF;
                END IF;
            END LOOP;
        END IF;

        IF match_record.away_players IS NOT NULL THEN
            FOR player_record IN
                SELECT
                    (COALESCE(player->>'playerId', player->>'player_id', player->>'id'))::integer AS player_id,
                    LOWER(COALESCE(player->>'cardType', player->>'card', player->>'card_type', player->>'kaart', 'none')) AS card_type
                FROM jsonb_array_elements(match_record.away_players) AS player
                WHERE COALESCE(player->>'playerId', player->>'player_id', player->>'id') IS NOT NULL
            LOOP
                normalized_card_type := COALESCE(player_record.card_type, 'none');

                IF EXISTS (SELECT 1 FROM public.players WHERE player_id = player_record.player_id) THEN
                    IF normalized_card_type IN ('yellow', 'geel') THEN
                        UPDATE public.players SET yellow_cards = yellow_cards + 1 WHERE player_id = player_record.player_id;
                    ELSIF normalized_card_type IN ('double_yellow', '2x geel', 'double-yellow') THEN
                        UPDATE public.players SET yellow_cards = yellow_cards + 2 WHERE player_id = player_record.player_id;
                    ELSIF normalized_card_type IN ('red', 'rood') THEN
                        UPDATE public.players SET red_cards = red_cards + 1 WHERE player_id = player_record.player_id;
                    END IF;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$function$;