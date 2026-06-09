-- Fase D: suspension RPCs require validated session token; INVOKER public wrappers (lint 0028).

DROP FUNCTION IF EXISTS public.is_player_suspended(integer, timestamp with time zone);
DROP FUNCTION IF EXISTS private.is_player_suspended(integer, timestamp with time zone);

CREATE OR REPLACE FUNCTION private.is_player_suspended(
  p_session_token uuid,
  player_id_param integer,
  match_date_param timestamp with time zone
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $function$
DECLARE
  v_role text;
  suspension_count integer;
  player_cards RECORD;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role = '' THEN
    RETURN NULL;
  END IF;

  SELECT yellow_cards, red_cards, suspended_matches_remaining
  INTO player_cards
  FROM public.players
  WHERE player_id = player_id_param;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF player_cards.suspended_matches_remaining > 0 THEN
    RETURN true;
  END IF;

  SELECT COUNT(*) INTO suspension_count
  FROM public.application_settings
  WHERE setting_category = 'manual_suspensions'
    AND setting_name = player_id_param::text
    AND is_active = true
    AND (setting_value->>'end_date')::timestamptz >= match_date_param;

  RETURN suspension_count > 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_player_suspended(
  p_session_token uuid,
  player_id_param integer,
  match_date_param timestamp with time zone
)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path TO public, private
AS $$
  SELECT private.is_player_suspended(p_session_token, player_id_param, match_date_param);
$$;

DROP FUNCTION IF EXISTS public.check_batch_players_suspended(integer[], timestamp with time zone);
DROP FUNCTION IF EXISTS private.check_batch_players_suspended(integer[], timestamp with time zone);

CREATE OR REPLACE FUNCTION private.check_batch_players_suspended(
  p_session_token uuid,
  player_ids integer[],
  match_date_param timestamp with time zone
)
RETURNS TABLE(player_id integer, is_suspended boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $$
DECLARE
  v_role text;
  player_record RECORD;
  suspension_count integer;
  player_cards RECORD;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role = '' THEN
    RETURN;
  END IF;

  FOR player_record IN
    SELECT unnest(player_ids) AS pid
  LOOP
    SELECT yellow_cards, red_cards, suspended_matches_remaining
    INTO player_cards
    FROM public.players
    WHERE public.players.player_id = player_record.pid;

    IF NOT FOUND THEN
      player_id := player_record.pid;
      is_suspended := false;
      RETURN NEXT;
      CONTINUE;
    END IF;

    IF player_cards.suspended_matches_remaining > 0 THEN
      player_id := player_record.pid;
      is_suspended := true;
      RETURN NEXT;
      CONTINUE;
    END IF;

    SELECT COUNT(*) INTO suspension_count
    FROM public.application_settings
    WHERE setting_category = 'manual_suspensions'
      AND setting_name = player_record.pid::text
      AND is_active = true
      AND (setting_value->>'end_date')::timestamptz >= match_date_param;

    player_id := player_record.pid;
    is_suspended := suspension_count > 0;
    RETURN NEXT;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_batch_players_suspended(
  p_session_token uuid,
  player_ids integer[],
  match_date_param timestamp with time zone
)
RETURNS TABLE(player_id integer, is_suspended boolean)
LANGUAGE sql
SECURITY INVOKER
SET search_path TO public, private
AS $$
  SELECT * FROM private.check_batch_players_suspended(p_session_token, player_ids, match_date_param);
$$;

REVOKE ALL ON FUNCTION private.is_player_suspended(uuid, integer, timestamp with time zone) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_player_suspended(uuid, integer, timestamp with time zone) TO anon;

REVOKE ALL ON FUNCTION public.is_player_suspended(uuid, integer, timestamp with time zone) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.is_player_suspended(uuid, integer, timestamp with time zone) TO anon;

REVOKE ALL ON FUNCTION private.check_batch_players_suspended(uuid, integer[], timestamp with time zone) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.check_batch_players_suspended(uuid, integer[], timestamp with time zone) TO anon;

REVOKE ALL ON FUNCTION public.check_batch_players_suspended(uuid, integer[], timestamp with time zone) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.check_batch_players_suspended(uuid, integer[], timestamp with time zone) TO anon;
