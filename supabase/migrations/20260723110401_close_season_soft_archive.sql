-- Soft-archive seizoen: season_label op matches/team_costs + SuperAdmin close_season RPC.
-- Nooit hard DELETE. Actieve seizoen = season_label IS NULL.

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS season_label text;

ALTER TABLE public.team_costs
  ADD COLUMN IF NOT EXISTS season_label text;

CREATE INDEX IF NOT EXISTS matches_organization_season_label_idx
  ON public.matches (organization_id, season_label);

CREATE INDEX IF NOT EXISTS team_costs_organization_season_label_idx
  ON public.team_costs (organization_id, season_label);

COMMENT ON COLUMN public.matches.season_label IS
  'NULL = actief seizoen; anders gearchiveerd seizoenslabel (bv. 2025-2026).';
COMMENT ON COLUMN public.team_costs.season_label IS
  'NULL = actief seizoen (categorieën); anders gearchiveerd. Saldo telt alle seizoenen.';

-- -----------------------------------------------------------------------------
-- update_player_cards: alleen actieve-seizoen matches (season_label IS NULL)
-- -----------------------------------------------------------------------------
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
  UPDATE public.players SET yellow_cards = 0, red_cards = 0
  WHERE player_id IS NOT NULL;

  FOR match_record IN
    SELECT match_id, home_players, away_players
    FROM public.matches
    WHERE is_submitted = true
      AND season_label IS NULL
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

-- -----------------------------------------------------------------------------
-- Actieve matches: season_label IS NULL (tenzij include_archived)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_matches_for_session(
  p_session_token uuid,
  p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS SETOF public.matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_team_ids integer[];
  v_org_id integer;
  v_include_archived boolean := false;
BEGIN
  SELECT s.role, s.team_ids, s.organization_id
  INTO v_role, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  v_include_archived := COALESCE((p_filters->>'include_archived')::boolean, false);

  RETURN QUERY
  SELECT m.*
  FROM public.matches m
  WHERE m.organization_id = v_org_id
    AND (v_include_archived OR m.season_label IS NULL)
    AND (NOT (p_filters ? 'is_cup_match') OR m.is_cup_match = (p_filters->>'is_cup_match')::boolean)
    AND (NOT (p_filters ? 'match_id') OR m.match_id = (p_filters->>'match_id')::integer)
    AND (NOT (p_filters ? 'unique_number') OR m.unique_number = p_filters->>'unique_number')
    AND (NOT (p_filters ? 'season_label') OR m.season_label IS NOT DISTINCT FROM (p_filters->>'season_label'))
    AND (
      v_role = 'admin'
      OR (v_role IN ('player_manager', 'referee') AND (
        m.home_team_id = ANY(COALESCE(v_team_ids, ARRAY[]::integer[]))
        OR m.away_team_id = ANY(COALESCE(v_team_ids, ARRAY[]::integer[]))
      ))
    )
  ORDER BY m.match_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_matches(p_organization_id integer DEFAULT 1)
RETURNS TABLE(
  match_id integer,
  unique_number text,
  match_date timestamptz,
  location text,
  speeldag text,
  home_team_id integer,
  away_team_id integer,
  home_score integer,
  away_score integer,
  home_position integer,
  away_position integer,
  referee text,
  is_submitted boolean,
  is_locked boolean,
  is_cup_match boolean,
  is_playoff_match boolean,
  is_playoff_finalized boolean,
  playoff_type text,
  home_team_name text,
  away_team_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    m.match_id,
    m.unique_number::text,
    m.match_date,
    m.location::text,
    m.speeldag::text,
    m.home_team_id,
    m.away_team_id,
    m.home_score,
    m.away_score,
    m.home_position,
    m.away_position,
    m.referee::text,
    m.is_submitted,
    m.is_locked,
    m.is_cup_match,
    m.is_playoff_match,
    m.is_playoff_finalized,
    m.playoff_type::text,
    ht.team_name::text AS home_team_name,
    at.team_name::text AS away_team_name
  FROM public.matches m
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  WHERE m.organization_id = p_organization_id
    AND m.season_label IS NULL
  ORDER BY m.match_date ASC;
$$;

-- get_matches_for_forms: alleen actief seizoen
CREATE OR REPLACE FUNCTION public.get_matches_for_forms(
  p_session_token uuid,
  p_team_id integer DEFAULT 0,
  p_has_elevated_permissions boolean DEFAULT false,
  p_competition_type text DEFAULT NULL,
  p_referee_user_id integer DEFAULT NULL,
  p_referee_username text DEFAULT NULL
)
RETURNS TABLE(
  match_id integer,
  unique_number text,
  match_date timestamptz,
  location text,
  speeldag text,
  home_team_id integer,
  away_team_id integer,
  home_score integer,
  away_score integer,
  referee text,
  referee_notes text,
  is_submitted boolean,
  is_locked boolean,
  home_players jsonb,
  away_players jsonb,
  is_cup_match boolean,
  is_playoff_match boolean,
  assigned_referee_id integer,
  poll_group_id text,
  poll_month text,
  home_team_name text,
  away_team_name text
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
  v_org_id integer;
  v_team_ids_text text;
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  SELECT s.user_id, s.role, s.username, s.team_ids, s.organization_id
  INTO v_user_id, v_role, v_username, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role = '' OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  v_team_ids_text := array_to_string(v_team_ids, ',');

  PERFORM public.apply_app_user_context(
    v_role,
    v_user_id,
    COALESCE(v_team_ids_text, ''),
    COALESCE(v_username, ''),
    v_org_id
  );

  RETURN QUERY
  SELECT
    m.match_id,
    m.unique_number::text,
    m.match_date,
    m.location::text,
    m.speeldag::text,
    m.home_team_id,
    m.away_team_id,
    m.home_score,
    m.away_score,
    m.referee::text,
    m.referee_notes::text,
    m.is_submitted,
    m.is_locked,
    m.home_players,
    m.away_players,
    m.is_cup_match,
    m.is_playoff_match,
    m.assigned_referee_id,
    m.poll_group_id::text,
    m.poll_month::text,
    ht.team_name::text AS home_team_name,
    at.team_name::text AS away_team_name
  FROM public.matches m
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  WHERE m.organization_id = v_org_id
  AND m.season_label IS NULL
  AND (
    CASE
      WHEN p_referee_user_id IS NOT NULL THEN
        m.assigned_referee_id = p_referee_user_id
        OR m.referee = COALESCE(p_referee_username, '')
        OR m.referee IS NULL
      WHEN p_has_elevated_permissions AND v_role IN ('admin', 'referee') THEN true
      WHEN p_team_id > 0 THEN
        m.home_team_id = p_team_id OR m.away_team_id = p_team_id
      ELSE false
    END
  )
  AND (
    p_competition_type IS NULL
    OR (p_competition_type = 'cup' AND m.is_cup_match IS TRUE)
    OR (p_competition_type = 'playoff' AND m.is_playoff_match IS TRUE)
    OR (
      p_competition_type = 'league'
      AND COALESCE(m.is_cup_match, false) IS NOT TRUE
      AND COALESCE(m.is_playoff_match, false) IS NOT TRUE
    )
  )
  ORDER BY m.match_date ASC;
END;
$$;

-- -----------------------------------------------------------------------------
-- team_costs RPC: season_label meegeven
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_team_costs_transactions(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_team_costs_transactions(
  p_session_token uuid,
  p_team_id integer DEFAULT NULL
)
RETURNS TABLE(
  id integer,
  team_id integer,
  cost_setting_id integer,
  match_id integer,
  amount numeric,
  transaction_date timestamptz,
  cost_name text,
  cost_category text,
  cost_default_amount numeric,
  match_unique_number text,
  match_date timestamptz,
  home_team_id integer,
  away_team_id integer,
  home_team_name text,
  away_team_name text,
  season_label text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
  v_team_ids_text text;
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role = '' OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  v_team_ids_text := array_to_string(v_team_ids, ',');

  PERFORM public.apply_app_user_context(
    v_role,
    v_user_id,
    COALESCE(v_team_ids_text, ''),
    COALESCE(v_username, ''),
    v_org_id
  );

  IF v_role = 'player_manager' THEN
    IF p_team_id IS NOT NULL AND NOT (p_team_id = ANY(v_team_ids)) THEN
      RETURN;
    END IF;
  ELSIF v_role <> 'admin' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    tc.id,
    tc.team_id,
    tc.cost_setting_id,
    tc.match_id,
    tc.amount,
    tc.transaction_date,
    c.name::text,
    c.category::text,
    c.amount,
    m.unique_number::text,
    m.match_date,
    m.home_team_id,
    m.away_team_id,
    ht.team_name::text,
    at.team_name::text,
    tc.season_label::text
  FROM public.team_costs tc
  JOIN public.costs c ON c.id = tc.cost_setting_id
  LEFT JOIN public.matches m ON m.match_id = tc.match_id
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  WHERE tc.organization_id = v_org_id
    AND (
      (
        v_role = 'admin'
        AND (p_team_id IS NULL OR tc.team_id = p_team_id)
      )
      OR (
        v_role = 'player_manager'
        AND tc.team_id = ANY(v_team_ids)
        AND (p_team_id IS NULL OR tc.team_id = p_team_id)
      )
    )
  ORDER BY tc.transaction_date DESC NULLS LAST, tc.id DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_team_costs_transactions(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_costs_transactions(uuid, integer) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- close_season_for_session (SuperAdmin only)
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
    SELECT 1 FROM public.application_settings
    WHERE organization_id = v_org_id
      AND setting_category = 'season_archives'
      AND setting_name = p_season_label
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dit seizoen is al gearchiveerd');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.matches
    WHERE organization_id = v_org_id AND season_label = p_season_label
  ) OR EXISTS (
    SELECT 1 FROM public.team_costs
    WHERE organization_id = v_org_id AND season_label = p_season_label
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Er bestaan al rijen met dit seizoenslabel');
  END IF;

  -- Snapshots vóór tagging
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

  -- Per-team finances snapshot (alle huidige untagged costs = seizoen tot cutoff)
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

  INSERT INTO public.application_settings (organization_id, setting_category, setting_name, setting_value)
  VALUES (
    v_org_id,
    'season_archives',
    p_season_label,
    jsonb_build_object(
      'team_finances', v_team_finances,
      'full_export', v_full_export,
      'closed_at', now(),
      'cutoff_date', p_cutoff_date,
      'target_capital', p_target_capital
    )
  );

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

  -- Gele kaarten altijd 0 voor org
  UPDATE public.players
  SET yellow_cards = 0
  WHERE organization_id = v_org_id;
  GET DIAGNOSTICS v_yellow_reset = ROW_COUNT;

  -- Rood resetten alleen zonder open schorsing
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

  -- Herbereken kaarten uit actieve (nu lege) matches — houdt rode kaarten niet automatisch;
  -- open schorsingen behouden hun red_cards hierboven. Daarna update_player_cards alleen
  -- actieve matches (geen), dus we moeten red_cards voor open schorsingen opnieuw zetten.
  PERFORM public.update_player_cards();

  -- Herstel rode kaarten voor spelers met open schorsing (snapshot)
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

CREATE OR REPLACE FUNCTION public.close_season_for_session(
  p_session_token uuid,
  p_season_label text,
  p_cutoff_date date,
  p_target_capital numeric DEFAULT 600
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  RETURN private.close_season_for_session(
    p_session_token,
    p_season_label,
    p_cutoff_date,
    p_target_capital
  );
END;
$$;

REVOKE ALL ON FUNCTION public.close_season_for_session(uuid, text, date, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_season_for_session(uuid, text, date, numeric) TO anon, authenticated;

-- Preview (read-only)
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
    LEFT JOIN public.team_costs tc ON tc.team_id = t.team_id AND tc.organization_id = v_org_id
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
    'sample_balances', v_sample
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.preview_close_season_for_session(
  p_session_token uuid,
  p_cutoff_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  RETURN private.preview_close_season_for_session(p_session_token, p_cutoff_date);
END;
$$;

REVOKE ALL ON FUNCTION public.preview_close_season_for_session(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_close_season_for_session(uuid, date) TO anon, authenticated;
