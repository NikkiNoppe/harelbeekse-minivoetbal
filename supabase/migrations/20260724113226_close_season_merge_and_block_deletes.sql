-- Close season: merge met bestaande publiek archief i.p.v. blokkeren;
-- preview: restanten na cutoff; hard-delete ops in bulk_manage geblokkeerd.

-- -----------------------------------------------------------------------------
-- Block hard deletes (defense-in-depth na soft-archive)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.bulk_manage_matches_for_session(
  p_session_token uuid,
  p_operation text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_org_id integer;
  v_rows integer := 0;
  v_item jsonb;
  v_home_org integer;
BEGIN
  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role <> 'admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  IF p_operation IN (
    'delete_by_unique_numbers',
    'delete_by_match_ids',
    'delete_competition',
    'delete_cup'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',
      'Wedstrijden mogen niet hard verwijderd worden. Sluit eerst het seizoen af via SuperAdmin → Platform → Seizoen afsluiten.'
    );
  END IF;

  IF p_operation = 'insert' THEN
    IF jsonb_typeof(p_payload) <> 'array' THEN
      RETURN jsonb_build_object('success', false, 'error', 'payload moet een array zijn');
    END IF;
    FOR v_item IN SELECT value FROM jsonb_array_elements(p_payload)
    LOOP
      SELECT t.organization_id INTO v_home_org
      FROM public.teams t
      WHERE t.team_id = (v_item->>'home_team_id')::integer;

      IF v_home_org IS DISTINCT FROM v_org_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd hoort niet bij actieve organisatie');
      END IF;

      INSERT INTO public.matches (
        unique_number, speeldag, home_team_id, away_team_id, match_date, location,
        is_cup_match, is_submitted, is_locked, home_score, away_score, organization_id
      ) VALUES (
        v_item->>'unique_number',
        v_item->>'speeldag',
        (v_item->>'home_team_id')::integer,
        NULLIF(v_item->>'away_team_id', '')::integer,
        (v_item->>'match_date')::timestamptz,
        v_item->>'location',
        COALESCE((v_item->>'is_cup_match')::boolean, false),
        COALESCE((v_item->>'is_submitted')::boolean, false),
        COALESCE((v_item->>'is_locked')::boolean, false),
        NULLIF(v_item->>'home_score', '')::integer,
        NULLIF(v_item->>'away_score', '')::integer,
        v_org_id
      );
      v_rows := v_rows + 1;
    END LOOP;
    RETURN jsonb_build_object('success', true, 'inserted', v_rows);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Onbekende operatie');
END;
$$;

-- -----------------------------------------------------------------------------
-- close_season: merge season_archives i.p.v. harde INSERT-fail
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.close_season_for_session(
  p_session_token uuid,
  p_season_label text,
  p_cutoff_date date,
  p_target_capital numeric DEFAULT 600
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_org_id integer;
  v_slug text;
  v_matches_tagged integer := 0;
  v_costs_tagged integer := 0;
  v_yellow_reset integer := 0;
  v_red_reset integer := 0;
  v_red_kept integer := 0;
  v_archive_id integer;
  v_existing jsonb;
  v_full_export jsonb;
  v_team_finances jsonb;
  v_standings jsonb := '[]'::jsonb;
  v_cup jsonb := '{}'::jsonb;
  v_playoff jsonb := '{}'::jsonb;
  v_players_snap jsonb;
  v_open_suspensions jsonb;
  v_teams jsonb;
  v_matches_json jsonb;
  v_costs_json jsonb;
  v_archive_value jsonb;
BEGIN
  SELECT s.user_id, s.role, s.organization_id
  INTO v_user_id, v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_user_id IS DISTINCT FROM -1 OR v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen SuperAdmin met actieve organisatie kan een seizoen afsluiten');
  END IF;

  IF p_season_label IS NULL OR trim(p_season_label) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seizoenlabel ontbreekt');
  END IF;

  IF p_cutoff_date IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cutoff-datum ontbreekt');
  END IF;

  SELECT slug INTO v_slug FROM public.organizations WHERE id = v_org_id;

  IF EXISTS (
    SELECT 1 FROM public.matches
    WHERE organization_id = v_org_id AND season_label = p_season_label
  ) OR EXISTS (
    SELECT 1 FROM public.team_costs
    WHERE organization_id = v_org_id AND season_label = p_season_label
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Er bestaan al rijen met dit seizoenslabel');
  END IF;

  SELECT id, setting_value
  INTO v_archive_id, v_existing
  FROM public.application_settings
  WHERE organization_id = v_org_id
    AND setting_category = 'season_archives'
    AND setting_name = p_season_label
  LIMIT 1;

  IF v_existing IS NOT NULL AND v_existing ? 'closed_at' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dit seizoen is al afgesloten');
  END IF;

  -- Bewaar publieke archiefvelden indien al aanwezig (of eerder geüpsert)
  IF v_existing IS NOT NULL THEN
    IF jsonb_typeof(v_existing->'competition_standings') = 'array' THEN
      v_standings := v_existing->'competition_standings';
    END IF;
    IF v_existing->'cup_winner' IS NOT NULL AND jsonb_typeof(v_existing->'cup_winner') = 'object' THEN
      v_cup := v_existing->'cup_winner';
    END IF;
    IF v_existing->'playoff' IS NOT NULL AND jsonb_typeof(v_existing->'playoff') = 'object' THEN
      v_playoff := v_existing->'playoff';
    END IF;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.team_name), '[]'::jsonb)
  INTO v_teams
  FROM public.teams t
  WHERE t.organization_id = v_org_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY m.match_date, m.match_id), '[]'::jsonb)
  INTO v_matches_json
  FROM public.matches m
  WHERE m.organization_id = v_org_id
    AND m.season_label IS NULL
    AND m.match_date < p_cutoff_date::timestamptz;

  SELECT COALESCE(jsonb_agg(to_jsonb(tc) ORDER BY tc.id), '[]'::jsonb)
  INTO v_costs_json
  FROM public.team_costs tc
  WHERE tc.organization_id = v_org_id
    AND tc.season_label IS NULL
    AND COALESCE(tc.transaction_date::date, DATE '1900-01-01') < p_cutoff_date;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'player_id', p.player_id,
    'team_id', p.team_id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'yellow_cards', p.yellow_cards,
    'red_cards', p.red_cards,
    'suspended_matches_remaining', p.suspended_matches_remaining
  ) ORDER BY p.player_id), '[]'::jsonb)
  INTO v_players_snap
  FROM public.players p
  WHERE p.organization_id = v_org_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'player_id', p.player_id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'red_cards', p.red_cards,
    'suspended_matches_remaining', p.suspended_matches_remaining
  )), '[]'::jsonb)
  INTO v_open_suspensions
  FROM public.players p
  WHERE p.organization_id = v_org_id
    AND COALESCE(p.suspended_matches_remaining, 0) > 0;

  SELECT COALESCE(jsonb_agg(row_to_json(x)::jsonb ORDER BY x.team_name), '[]'::jsonb)
  INTO v_team_finances
  FROM (
    SELECT
      t.team_id,
      t.team_name,
      COALESCE(SUM(CASE WHEN c.category = 'deposit' THEN ABS(tc.amount) ELSE 0 END), 0) AS deposits,
      COALESCE(SUM(CASE WHEN c.category = 'match_cost' AND (
        lower(c.name) LIKE '%veld%' OR lower(c.name) LIKE '%field%'
      ) THEN ABS(tc.amount) ELSE 0 END), 0) AS field_costs,
      COALESCE(SUM(CASE WHEN c.category = 'match_cost' AND lower(c.name) LIKE '%scheids%' THEN ABS(tc.amount) ELSE 0 END), 0) AS referee_costs,
      COALESCE(SUM(CASE WHEN c.category = 'match_cost' AND (
        lower(c.name) LIKE '%administratie%' OR lower(c.name) LIKE '%admin%'
      ) THEN ABS(tc.amount) ELSE 0 END), 0) AS admin_costs,
      COALESCE(SUM(CASE WHEN c.category = 'penalty' THEN ABS(tc.amount) ELSE 0 END), 0) AS fines,
      COALESCE(SUM(
        CASE
          WHEN c.category = 'deposit' THEN ABS(tc.amount)
          WHEN c.category IN ('adjustment', 'other') THEN tc.amount
          ELSE -ABS(tc.amount)
        END
      ), 0) AS balance
    FROM public.teams t
    LEFT JOIN public.team_costs tc
      ON tc.team_id = t.team_id
     AND tc.organization_id = v_org_id
     AND tc.season_label IS NULL
     AND COALESCE(tc.transaction_date::date, DATE '1900-01-01') < p_cutoff_date
    LEFT JOIN public.costs c ON c.id = tc.cost_setting_id
    WHERE t.organization_id = v_org_id
    GROUP BY t.team_id, t.team_name
  ) x;

  v_full_export := jsonb_build_object(
    'meta', jsonb_build_object(
      'organization_id', v_org_id,
      'organization_slug', v_slug,
      'season_label', p_season_label,
      'cutoff_date', p_cutoff_date,
      'closed_at', now(),
      'target_capital', p_target_capital,
      'schema_version', 1
    ),
    'competition_standings', v_standings,
    'cup', v_cup,
    'playoff', v_playoff,
    'teams', v_teams,
    'matches', v_matches_json,
    'team_costs', v_costs_json,
    'team_finances', v_team_finances,
    'players_card_snapshot', v_players_snap,
    'open_suspensions_kept', v_open_suspensions
  );

  v_archive_value := COALESCE(v_existing, '{}'::jsonb) || jsonb_build_object(
    'team_finances', v_team_finances,
    'full_export', v_full_export,
    'closed_at', now(),
    'cutoff_date', p_cutoff_date,
    'target_capital', p_target_capital,
    'competition_standings', v_standings,
    'cup_winner', CASE WHEN v_cup = '{}'::jsonb THEN COALESCE(v_existing->'cup_winner', 'null'::jsonb) ELSE v_cup END,
    'playoff', CASE WHEN v_playoff = '{}'::jsonb THEN COALESCE(v_existing->'playoff', 'null'::jsonb) ELSE v_playoff END
  );

  IF v_archive_id IS NULL THEN
    INSERT INTO public.application_settings (organization_id, setting_category, setting_name, setting_value)
    VALUES (v_org_id, 'season_archives', p_season_label, v_archive_value);
  ELSE
    UPDATE public.application_settings
    SET setting_value = v_archive_value
    WHERE id = v_archive_id;
  END IF;

  UPDATE public.matches
  SET season_label = p_season_label
  WHERE organization_id = v_org_id
    AND season_label IS NULL
    AND match_date < p_cutoff_date::timestamptz;
  GET DIAGNOSTICS v_matches_tagged = ROW_COUNT;

  UPDATE public.team_costs
  SET season_label = p_season_label
  WHERE organization_id = v_org_id
    AND season_label IS NULL
    AND COALESCE(transaction_date::date, DATE '1900-01-01') < p_cutoff_date;
  GET DIAGNOSTICS v_costs_tagged = ROW_COUNT;

  UPDATE public.players
  SET yellow_cards = 0
  WHERE organization_id = v_org_id;
  GET DIAGNOSTICS v_yellow_reset = ROW_COUNT;

  UPDATE public.players
  SET red_cards = 0
  WHERE organization_id = v_org_id
    AND COALESCE(suspended_matches_remaining, 0) = 0
    AND COALESCE(red_cards, 0) <> 0;
  GET DIAGNOSTICS v_red_reset = ROW_COUNT;

  SELECT COUNT(*)::integer INTO v_red_kept
  FROM public.players
  WHERE organization_id = v_org_id
    AND COALESCE(suspended_matches_remaining, 0) > 0
    AND COALESCE(red_cards, 0) > 0;

  PERFORM public.update_player_cards();

  UPDATE public.players p
  SET red_cards = GREATEST(COALESCE(p.red_cards, 0), 1)
  WHERE p.organization_id = v_org_id
    AND COALESCE(p.suspended_matches_remaining, 0) > 0;

  RETURN jsonb_build_object(
    'success', true,
    'season_label', p_season_label,
    'cutoff_date', p_cutoff_date,
    'matches_tagged', v_matches_tagged,
    'costs_tagged', v_costs_tagged,
    'yellow_reset', v_yellow_reset,
    'red_reset', v_red_reset,
    'red_kept', v_red_kept,
    'full_export', v_full_export,
    'download_filename', COALESCE(v_slug, 'org') || '-seizoen-' || p_season_label || '.json'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- -----------------------------------------------------------------------------
-- Preview: restanten + seizoen-gefilterde sample balances
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.preview_close_season_for_session(
  p_session_token uuid,
  p_cutoff_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_org_id integer;
  v_matches integer;
  v_costs integer;
  v_matches_remaining integer;
  v_costs_remaining integer;
  v_sample jsonb;
BEGIN
  SELECT s.user_id, s.role, s.organization_id
  INTO v_user_id, v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_user_id IS DISTINCT FROM -1 OR v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen SuperAdmin');
  END IF;

  SELECT COUNT(*)::integer INTO v_matches
  FROM public.matches
  WHERE organization_id = v_org_id
    AND season_label IS NULL
    AND match_date < p_cutoff_date::timestamptz;

  SELECT COUNT(*)::integer INTO v_costs
  FROM public.team_costs
  WHERE organization_id = v_org_id
    AND season_label IS NULL
    AND COALESCE(transaction_date::date, DATE '1900-01-01') < p_cutoff_date;

  SELECT COUNT(*)::integer INTO v_matches_remaining
  FROM public.matches
  WHERE organization_id = v_org_id
    AND season_label IS NULL
    AND match_date >= p_cutoff_date::timestamptz;

  SELECT COUNT(*)::integer INTO v_costs_remaining
  FROM public.team_costs
  WHERE organization_id = v_org_id
    AND season_label IS NULL
    AND COALESCE(transaction_date::date, DATE '1900-01-01') >= p_cutoff_date;

  SELECT COALESCE(jsonb_agg(row_to_json(x)::jsonb ORDER BY x.team_name), '[]'::jsonb)
  INTO v_sample
  FROM (
    SELECT
      t.team_name,
      COALESCE(SUM(
        CASE
          WHEN c.category = 'deposit' THEN ABS(tc.amount)
          WHEN c.category IN ('adjustment', 'other') THEN tc.amount
          ELSE -ABS(tc.amount)
        END
      ), 0) AS balance
    FROM public.teams t
    LEFT JOIN public.team_costs tc
      ON tc.team_id = t.team_id
     AND tc.organization_id = v_org_id
     AND tc.season_label IS NULL
     AND COALESCE(tc.transaction_date::date, DATE '1900-01-01') < p_cutoff_date
    LEFT JOIN public.costs c ON c.id = tc.cost_setting_id
    WHERE t.organization_id = v_org_id
    GROUP BY t.team_id, t.team_name
    ORDER BY t.team_name
    LIMIT 5
  ) x;

  RETURN jsonb_build_object(
    'success', true,
    'matches_to_tag', v_matches,
    'costs_to_tag', v_costs,
    'matches_remaining_after_cutoff', v_matches_remaining,
    'costs_remaining_after_cutoff', v_costs_remaining,
    'sample_balances', v_sample
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- Publiek archief upsert: altijd organization_id uit sessie (merge met close)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.upsert_season_archive_for_session(
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
  v_org_id integer;
  v_existing jsonb;
  v_merged jsonb;
  v_row_id integer;
BEGIN
  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins met actieve organisatie kunnen archiveren');
  END IF;

  IF p_season_label IS NULL OR trim(p_season_label) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seizoenlabel ontbreekt');
  END IF;

  IF p_field NOT IN ('competition_standings', 'cup_winner', 'playoff') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldig archiefveld');
  END IF;

  SELECT id, setting_value INTO v_row_id, v_existing
  FROM public.application_settings
  WHERE organization_id = v_org_id
    AND setting_category = 'season_archives'
    AND setting_name = p_season_label
  LIMIT 1;

  v_merged := COALESCE(v_existing, '{}'::jsonb) || jsonb_build_object(p_field, p_value);

  IF v_row_id IS NULL THEN
    INSERT INTO public.application_settings (
      organization_id, setting_category, setting_name, setting_value
    )
    VALUES (v_org_id, 'season_archives', p_season_label, v_merged);
  ELSE
    UPDATE public.application_settings
    SET setting_value = v_merged
    WHERE id = v_row_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Archief opgeslagen');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
