-- Replace spoofable p_user_id write/read RPCs with p_session_token + private.resolve_app_session.

-- =============================================================================
-- update_match_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_match_for_session(
  p_session_token uuid,
  p_match_id integer,
  p_update_data jsonb
)
RETURNS TABLE(match_id integer, success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
DECLARE
  v_user_id integer;
  v_role text;
  v_username text;
  v_team_ids integer[];
  v_home_team_id integer;
  v_away_team_id integer;
  v_can_update boolean := false;
  v_is_submitted boolean;
BEGIN
  SELECT s.user_id, s.role, s.username, s.team_ids
  INTO v_user_id, v_role, v_username, v_team_ids
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN QUERY SELECT p_match_id, false, 'Geen actieve sessie'::text;
    RETURN;
  END IF;

  SELECT m.home_team_id, m.away_team_id, m.is_submitted
  INTO v_home_team_id, v_away_team_id, v_is_submitted
  FROM public.matches m
  WHERE m.match_id = p_match_id;

  IF v_home_team_id IS NULL THEN
    RETURN QUERY SELECT p_match_id, false, 'Wedstrijd niet gevonden'::text;
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    v_can_update := true;
  ELSIF v_role = 'player_manager' THEN
    v_can_update := v_team_ids IS NOT NULL
      AND (v_home_team_id = ANY(v_team_ids) OR v_away_team_id = ANY(v_team_ids));
    IF v_can_update AND v_is_submitted = true THEN
      IF p_update_data ? 'home_players' OR p_update_data ? 'away_players' THEN
        RETURN QUERY SELECT p_match_id, false,
          'Spelerslijst kan niet meer gewijzigd worden na indiening. Contacteer een admin.'::text;
        RETURN;
      END IF;
    END IF;
  ELSIF v_role = 'referee' THEN
    v_can_update := EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.match_id = p_match_id
        AND (m.assigned_referee_id = v_user_id OR m.referee = v_username)
    );
  END IF;

  IF NOT v_can_update THEN
    RETURN QUERY SELECT p_match_id, false, 'Geen toegang tot deze wedstrijd'::text;
    RETURN;
  END IF;

  IF v_role = 'referee' THEN
    UPDATE public.matches SET
      home_score = CASE WHEN p_update_data ? 'home_score' THEN (p_update_data->>'home_score')::integer ELSE home_score END,
      away_score = CASE WHEN p_update_data ? 'away_score' THEN (p_update_data->>'away_score')::integer ELSE away_score END,
      is_submitted = CASE WHEN p_update_data ? 'is_submitted' THEN (p_update_data->>'is_submitted')::boolean ELSE is_submitted END,
      is_locked = CASE WHEN p_update_data ? 'is_locked' THEN (p_update_data->>'is_locked')::boolean ELSE is_locked END,
      referee = CASE WHEN p_update_data ? 'referee' THEN p_update_data->>'referee' ELSE referee END,
      referee_notes = CASE WHEN p_update_data ? 'referee_notes' THEN p_update_data->>'referee_notes' ELSE referee_notes END,
      home_players = CASE WHEN p_update_data ? 'home_players' THEN (p_update_data->'home_players')::jsonb ELSE home_players END,
      away_players = CASE WHEN p_update_data ? 'away_players' THEN (p_update_data->'away_players')::jsonb ELSE away_players END
    WHERE matches.match_id = p_match_id;
    RETURN QUERY SELECT p_match_id, true, 'Wedstrijd succesvol bijgewerkt'::text;
    RETURN;
  END IF;

  UPDATE public.matches SET
    home_score = CASE WHEN p_update_data ? 'home_score' THEN (p_update_data->>'home_score')::integer ELSE home_score END,
    away_score = CASE WHEN p_update_data ? 'away_score' THEN (p_update_data->>'away_score')::integer ELSE away_score END,
    home_players = CASE WHEN p_update_data ? 'home_players' THEN (p_update_data->'home_players')::jsonb ELSE home_players END,
    away_players = CASE WHEN p_update_data ? 'away_players' THEN (p_update_data->'away_players')::jsonb ELSE away_players END,
    is_submitted = CASE WHEN p_update_data ? 'is_submitted' THEN (p_update_data->>'is_submitted')::boolean ELSE is_submitted END,
    is_locked = CASE WHEN p_update_data ? 'is_locked' THEN (p_update_data->>'is_locked')::boolean ELSE is_locked END,
    location = CASE WHEN p_update_data ? 'location' THEN p_update_data->>'location' ELSE location END,
    referee = CASE WHEN p_update_data ? 'referee' THEN p_update_data->>'referee' ELSE referee END,
    referee_notes = CASE WHEN p_update_data ? 'referee_notes' THEN p_update_data->>'referee_notes' ELSE referee_notes END,
    assigned_referee_id = CASE WHEN p_update_data ? 'assigned_referee_id' THEN (p_update_data->>'assigned_referee_id')::integer ELSE assigned_referee_id END,
    match_date = CASE WHEN p_update_data ? 'match_date' THEN (p_update_data->>'match_date')::timestamptz ELSE match_date END,
    speeldag = CASE WHEN p_update_data ? 'speeldag' THEN p_update_data->>'speeldag' ELSE speeldag END
  WHERE matches.match_id = p_match_id;

  RETURN QUERY SELECT p_match_id, true, 'Wedstrijd succesvol bijgewerkt'::text;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_match_for_session(uuid, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_match_for_session(uuid, integer, jsonb) TO anon, authenticated;

-- =============================================================================
-- create_user_for_session / update_user_password_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION public.create_user_for_session(
  p_session_token uuid,
  username_param character varying,
  email_param character varying,
  password_param character varying,
  role_param public.user_role DEFAULT 'player_manager'::public.user_role
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'private'
AS $$
DECLARE
  v_role text;
  new_user public.users;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  INSERT INTO public.users (username, email, password, role)
  VALUES (
    username_param,
    email_param,
    extensions.crypt(password_param, extensions.gen_salt('bf', 8)),
    role_param
  )
  RETURNING * INTO new_user;

  RETURN new_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_password_for_session(
  p_session_token uuid,
  user_id_param integer,
  new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'private'
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN false;
  END IF;

  UPDATE public.users
  SET password = extensions.crypt(new_password, extensions.gen_salt('bf', 8))
  WHERE user_id = user_id_param;

  RETURN found;
END;
$$;

REVOKE ALL ON FUNCTION public.create_user_for_session(uuid, character varying, character varying, character varying, public.user_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_user_password_for_session(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_user_for_session(uuid, character varying, character varying, character varying, public.user_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_password_for_session(uuid, integer, text) TO anon, authenticated;

-- =============================================================================
-- get_players_for_session / insert_player_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_players_for_session(
  p_session_token uuid,
  p_team_id integer DEFAULT NULL
)
RETURNS TABLE(
  player_id integer,
  first_name character varying,
  last_name character varying,
  birth_date date,
  team_id integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_username text;
  v_team_ids integer[];
BEGIN
  SELECT s.user_id, s.role, s.username, s.team_ids
  INTO v_user_id, v_role, v_username, v_team_ids
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    IF p_team_id IS NULL THEN
      RETURN QUERY
      SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
      FROM public.players p
      ORDER BY p.last_name, p.first_name;
    ELSE
      RETURN QUERY
      SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
      FROM public.players p
      WHERE p.team_id = p_team_id
      ORDER BY p.last_name, p.first_name;
    END IF;
    RETURN;
  END IF;

  IF v_role = 'player_manager' THEN
    IF p_team_id IS NOT NULL AND NOT (p_team_id = ANY(v_team_ids)) THEN
      RETURN;
    END IF;
    IF p_team_id IS NULL THEN
      RETURN QUERY
      SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
      FROM public.players p
      WHERE p.team_id = ANY(v_team_ids)
      ORDER BY p.last_name, p.first_name;
    ELSE
      RETURN QUERY
      SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
      FROM public.players p
      WHERE p.team_id = p_team_id
      ORDER BY p.last_name, p.first_name;
    END IF;
    RETURN;
  END IF;

  IF v_role = 'referee' AND p_team_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.matches m
      WHERE (m.home_team_id = p_team_id OR m.away_team_id = p_team_id)
        AND (m.assigned_referee_id = v_user_id OR m.referee = v_username)
    ) THEN
      RETURN QUERY
      SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
      FROM public.players p
      WHERE p.team_id = p_team_id
      ORDER BY p.last_name, p.first_name;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_player_for_session(
  p_session_token uuid,
  p_first_name character varying,
  p_last_name character varying,
  p_birth_date date,
  p_team_id integer
)
RETURNS TABLE(player_id integer, success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_team_ids integer[];
  v_new_player_id integer;
BEGIN
  SELECT s.role, s.team_ids
  INTO v_role, v_team_ids
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN QUERY SELECT NULL::integer, false, 'Geen actieve sessie'::text;
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    NULL;
  ELSIF v_role = 'player_manager' THEN
    IF v_team_ids IS NULL OR NOT (p_team_id = ANY(v_team_ids)) THEN
      RETURN QUERY SELECT NULL::integer, false, 'Geen toegang tot dit team'::text;
      RETURN;
    END IF;
  ELSE
    RETURN QUERY SELECT NULL::integer, false, 'Onvoldoende rechten'::text;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.players
    WHERE first_name = p_first_name AND last_name = p_last_name AND birth_date = p_birth_date
  ) THEN
    RETURN QUERY SELECT NULL::integer, false, 'Speler bestaat al'::text;
    RETURN;
  END IF;

  INSERT INTO public.players (first_name, last_name, birth_date, team_id)
  VALUES (p_first_name, p_last_name, p_birth_date, p_team_id)
  RETURNING public.players.player_id INTO v_new_player_id;

  RETURN QUERY SELECT v_new_player_id, true, 'Speler toegevoegd'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.get_players_for_session(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.insert_player_for_session(uuid, character varying, character varying, date, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_players_for_session(uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_player_for_session(uuid, character varying, character varying, date, integer) TO anon, authenticated;

-- =============================================================================
-- Financial session RPCs
-- =============================================================================
CREATE OR REPLACE FUNCTION public.add_team_cost_for_session(
  p_session_token uuid,
  p_team_id integer,
  p_cost_setting_id integer,
  p_amount numeric,
  p_transaction_date date DEFAULT CURRENT_DATE,
  p_match_id integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
DECLARE
  v_user_id integer;
  v_role text;
  v_username text;
  v_team_ids integer[];
  v_new_id integer;
  v_category text;
  v_cost_name text;
BEGIN
  SELECT s.user_id, s.role, s.username, s.team_ids
  INTO v_user_id, v_role, v_username, v_team_ids
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geen actieve sessie');
  END IF;

  SELECT c.category::text, trim(c.name)
  INTO v_category, v_cost_name
  FROM public.costs c
  WHERE c.id = p_cost_setting_id;

  IF v_category IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kosttype niet gevonden');
  END IF;

  IF v_role = 'admin' THEN
    NULL;
  ELSIF v_role = 'referee' AND v_category = 'penalty' AND p_match_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.match_id = p_match_id
        AND (m.assigned_referee_id = v_user_id OR (m.referee IS NOT NULL AND m.referee <> '' AND m.referee = v_username))
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Geen rechten om boete toe te voegen voor deze wedstrijd (niet toegewezen als scheids).');
    END IF;
  ELSIF v_role = 'player_manager' AND v_category = 'penalty' AND p_match_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.match_id = p_match_id
        AND p_team_id IS NOT NULL
        AND p_team_id = ANY(v_team_ids)
        AND (m.home_team_id = p_team_id OR m.away_team_id = p_team_id)
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Geen rechten om deze boete toe te voegen (alleen voor je eigen ploeg op deze wedstrijd).');
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen deze kost toevoegen (of als scheids alleen boetes voor jouw wedstrijd).');
  END IF;

  IF p_match_id IS NOT NULL THEN
    INSERT INTO public.team_costs (team_id, cost_setting_id, amount, transaction_date, match_id)
    VALUES (p_team_id, p_cost_setting_id, p_amount, COALESCE(p_transaction_date::date, CURRENT_DATE), p_match_id)
    ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
    DO UPDATE SET amount = EXCLUDED.amount, transaction_date = EXCLUDED.transaction_date
    RETURNING id INTO v_new_id;
  ELSE
    INSERT INTO public.team_costs (team_id, cost_setting_id, amount, transaction_date, match_id)
    VALUES (p_team_id, p_cost_setting_id, p_amount, COALESCE(p_transaction_date::date, CURRENT_DATE), NULL)
    RETURNING id INTO v_new_id;
  END IF;

  IF v_category = 'penalty' AND p_match_id IS NOT NULL AND public.cost_name_implies_match_cost_suppression(v_cost_name) THEN
    DELETE FROM public.team_costs tc
    USING public.costs c
    WHERE tc.match_id = p_match_id AND tc.cost_setting_id = c.id AND c.category = 'match_cost';
  END IF;

  IF v_category = 'penalty' AND p_match_id IS NOT NULL AND public.cost_name_is_forfait_verwittigd(v_cost_name) THEN
    DELETE FROM public.referee_assignments WHERE match_id = p_match_id;
    UPDATE public.matches SET assigned_referee_id = NULL, referee = NULL WHERE match_id = p_match_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Kost succesvol toegevoegd', 'id', v_new_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.manage_team_cost_for_session(
  p_session_token uuid,
  p_cost_id integer,
  p_operation text,
  p_amount numeric DEFAULT NULL,
  p_cost_setting_id integer DEFAULT NULL,
  p_team_id integer DEFAULT NULL,
  p_transaction_date timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_username text;
  v_cost_record record;
  v_match_id integer;
  v_affected integer;
BEGIN
  SELECT s.user_id, s.role, s.username
  INTO v_user_id, v_role, v_username
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geen actieve sessie');
  END IF;

  SELECT tc.id, tc.match_id, tc.team_id, tc.amount, tc.cost_setting_id
  INTO v_cost_record
  FROM public.team_costs tc
  WHERE tc.id = p_cost_id;

  IF v_cost_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kost niet gevonden');
  END IF;

  v_match_id := v_cost_record.match_id;

  IF v_role = 'admin' THEN
    NULL;
  ELSIF v_role = 'referee' THEN
    IF v_match_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Scheidsrechters kunnen alleen kosten beheren die aan een wedstrijd gekoppeld zijn');
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.match_id = v_match_id
        AND (m.assigned_referee_id = v_user_id OR m.referee = v_username)
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Je bent niet toegewezen als scheidsrechter voor deze wedstrijd');
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Onvoldoende rechten');
  END IF;

  IF p_operation = 'delete' THEN
    DELETE FROM public.team_costs WHERE id = p_cost_id;
    GET DIAGNOSTICS v_affected = ROW_COUNT;
    IF v_affected = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Kost niet gevonden of al verwijderd');
    END IF;
    RETURN jsonb_build_object('success', true, 'message', 'Kost succesvol verwijderd', 'deleted_id', p_cost_id);
  ELSIF p_operation = 'update' THEN
    UPDATE public.team_costs
    SET
      amount = COALESCE(p_amount, amount),
      cost_setting_id = COALESCE(p_cost_setting_id, cost_setting_id),
      team_id = COALESCE(p_team_id, team_id),
      transaction_date = COALESCE(p_transaction_date, transaction_date)
    WHERE id = p_cost_id;
    GET DIAGNOSTICS v_affected = ROW_COUNT;
    IF v_affected = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Kost niet gevonden');
    END IF;
    RETURN jsonb_build_object('success', true, 'message', 'Kost succesvol bijgewerkt');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldige operatie: ' || p_operation);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Database fout: ' || SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_clear_skip_auto_match_costs_for_session(
  p_session_token uuid,
  p_match_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $fn$
DECLARE
  v_role text;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen dit resetten.');
  END IF;

  IF p_match_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldige wedstrijd');
  END IF;

  UPDATE public.matches SET skip_auto_match_costs = false WHERE match_id = p_match_id;

  RETURN jsonb_build_object('success', true, 'message', 'Automatische wedstrijdkosten weer ingeschakeld');
END;
$fn$;

REVOKE ALL ON FUNCTION public.add_team_cost_for_session(uuid, integer, integer, numeric, date, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.manage_team_cost_for_session(uuid, integer, text, numeric, integer, integer, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_clear_skip_auto_match_costs_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_team_cost_for_session(uuid, integer, integer, numeric, date, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.manage_team_cost_for_session(uuid, integer, text, numeric, integer, integer, timestamptz) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_clear_skip_auto_match_costs_for_session(uuid, integer) TO anon, authenticated;

-- =============================================================================
-- upsert_season_archive_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION public.upsert_season_archive_for_session(
  p_session_token uuid,
  p_season_label text,
  p_field text,
  p_value jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_existing jsonb;
  v_merged jsonb;
  v_row_id integer;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen archiveren');
  END IF;

  IF p_season_label IS NULL OR trim(p_season_label) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seizoenlabel ontbreekt');
  END IF;

  IF p_field NOT IN ('competition_standings', 'cup_winner', 'playoff') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldig archiefveld');
  END IF;

  SELECT id, setting_value INTO v_row_id, v_existing
  FROM public.application_settings
  WHERE setting_category = 'season_archives' AND setting_name = p_season_label
  LIMIT 1;

  v_merged := COALESCE(v_existing, '{}'::jsonb) || jsonb_build_object(p_field, p_value);

  IF v_row_id IS NULL THEN
    INSERT INTO public.application_settings (setting_category, setting_name, setting_value)
    VALUES ('season_archives', p_season_label, v_merged);
  ELSE
    UPDATE public.application_settings SET setting_value = v_merged WHERE id = v_row_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Archief opgeslagen');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_season_archive_for_session(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_season_archive_for_session(uuid, text, text, jsonb) TO anon, authenticated;

-- =============================================================================
-- Drop legacy spoofable RPCs
-- =============================================================================
DROP FUNCTION IF EXISTS public.create_user_with_hashed_password(character varying, character varying, character varying, public.user_role);
DROP FUNCTION IF EXISTS public.update_user_password(integer, text);
DROP FUNCTION IF EXISTS public.update_match_with_context(integer, integer, jsonb);
DROP FUNCTION IF EXISTS public.insert_player_with_context(integer, character varying, character varying, date, integer);
DROP FUNCTION IF EXISTS public.get_players_for_team(integer, integer);
DROP FUNCTION IF EXISTS public.add_team_cost_as_admin(integer, integer, integer, numeric, date, integer);
DROP FUNCTION IF EXISTS public.manage_team_cost_for_match(integer, integer, text, numeric, integer, integer, timestamptz);
DROP FUNCTION IF EXISTS public.admin_clear_skip_auto_match_costs(integer, integer);
DROP FUNCTION IF EXISTS public.upsert_season_archive(integer, text, text, jsonb);
