-- Tussentijdse seizoensbackup (JSON) zonder afsluiten / taggen / kaarten-reset.
-- SuperAdmin only; bewaart snapshot in application_settings + return voor download.

CREATE OR REPLACE FUNCTION private.export_season_backup_for_session(
  p_session_token uuid,
  p_season_label text DEFAULT '2025-2026',
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
  v_stamp text;
  v_backup_name text;
  v_full_export jsonb;
  v_team_finances jsonb;
  v_teams jsonb;
  v_matches_json jsonb;
  v_costs_json jsonb;
  v_players_snap jsonb;
  v_open_suspensions jsonb;
  v_match_count integer;
  v_cost_count integer;
BEGIN
  SELECT s.user_id, s.role, s.organization_id
  INTO v_user_id, v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_user_id IS DISTINCT FROM -1 OR v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen SuperAdmin met actieve organisatie kan een backup maken');
  END IF;

  IF p_season_label IS NULL OR trim(p_season_label) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seizoenlabel ontbreekt');
  END IF;

  SELECT slug INTO v_slug FROM public.organizations WHERE id = v_org_id;
  v_stamp := to_char(now() AT TIME ZONE 'Europe/Brussels', 'YYYYMMDD-HH24MI');
  v_backup_name := trim(p_season_label) || '-interim-' || v_stamp;

  SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.team_name), '[]'::jsonb)
  INTO v_teams
  FROM public.teams t
  WHERE t.organization_id = v_org_id;

  -- Actief seizoen (nog niet soft-gearchiveerd)
  SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY m.match_date, m.match_id), '[]'::jsonb)
  INTO v_matches_json
  FROM public.matches m
  WHERE m.organization_id = v_org_id
    AND m.season_label IS NULL;

  SELECT COALESCE(jsonb_agg(to_jsonb(tc) ORDER BY tc.id), '[]'::jsonb)
  INTO v_costs_json
  FROM public.team_costs tc
  WHERE tc.organization_id = v_org_id
    AND tc.season_label IS NULL;

  SELECT COUNT(*)::integer INTO v_match_count
  FROM public.matches
  WHERE organization_id = v_org_id AND season_label IS NULL;

  SELECT COUNT(*)::integer INTO v_cost_count
  FROM public.team_costs
  WHERE organization_id = v_org_id AND season_label IS NULL;

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
    LEFT JOIN public.costs c ON c.id = tc.cost_setting_id
    WHERE t.organization_id = v_org_id
    GROUP BY t.team_id, t.team_name
  ) x;

  v_full_export := jsonb_build_object(
    'meta', jsonb_build_object(
      'organization_id', v_org_id,
      'organization_slug', v_slug,
      'season_label', p_season_label,
      'backup_type', 'interim',
      'exported_at', now(),
      'target_capital', p_target_capital,
      'schema_version', 1,
      'match_count', v_match_count,
      'cost_count', v_cost_count
    ),
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
    'season_backups',
    v_backup_name,
    jsonb_build_object(
      'full_export', v_full_export,
      'exported_at', now(),
      'season_label', p_season_label,
      'backup_type', 'interim'
    )
  );

  -- Laatste interim onder vaste naam (overschrijven) voor snelle herdownload
  INSERT INTO public.application_settings (organization_id, setting_category, setting_name, setting_value)
  VALUES (
    v_org_id,
    'season_backups',
    trim(p_season_label) || '-interim-latest',
    jsonb_build_object(
      'full_export', v_full_export,
      'exported_at', now(),
      'season_label', p_season_label,
      'backup_type', 'interim',
      'source_name', v_backup_name
    )
  )
  ON CONFLICT (organization_id, setting_category, setting_name)
  DO UPDATE SET setting_value = EXCLUDED.setting_value;

  RETURN jsonb_build_object(
    'success', true,
    'season_label', p_season_label,
    'backup_name', v_backup_name,
    'match_count', v_match_count,
    'cost_count', v_cost_count,
    'full_export', v_full_export,
    'download_filename', COALESCE(v_slug, 'org') || '-seizoen-' || trim(p_season_label) || '-backup-' || v_stamp || '.json'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.export_season_backup_for_session(
  p_session_token uuid,
  p_season_label text DEFAULT '2025-2026',
  p_target_capital numeric DEFAULT 600
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  RETURN private.export_season_backup_for_session(
    p_session_token,
    p_season_label,
    p_target_capital
  );
END;
$$;

REVOKE ALL ON FUNCTION public.export_season_backup_for_session(uuid, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.export_season_backup_for_session(uuid, text, numeric) TO anon, authenticated;

-- Helper: laatste interim-backup opnieuw ophalen
CREATE OR REPLACE FUNCTION private.get_latest_season_backup_for_session(
  p_session_token uuid,
  p_season_label text DEFAULT '2025-2026'
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
  v_row jsonb;
  v_name text;
BEGIN
  SELECT s.user_id, s.role, s.organization_id
  INTO v_user_id, v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_user_id IS DISTINCT FROM -1 OR v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen SuperAdmin');
  END IF;

  v_name := trim(p_season_label) || '-interim-latest';

  SELECT setting_value INTO v_row
  FROM public.application_settings
  WHERE organization_id = v_org_id
    AND setting_category = 'season_backups'
    AND setting_name = v_name
  LIMIT 1;

  IF v_row IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nog geen tussentijdse backup gevonden');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'full_export', v_row->'full_export',
    'exported_at', v_row->>'exported_at',
    'download_filename', COALESCE(
      (SELECT slug FROM public.organizations WHERE id = v_org_id),
      'org'
    ) || '-seizoen-' || trim(p_season_label) || '-backup-latest.json'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_latest_season_backup_for_session(
  p_session_token uuid,
  p_season_label text DEFAULT '2025-2026'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  RETURN private.get_latest_season_backup_for_session(p_session_token, p_season_label);
END;
$$;

REVOKE ALL ON FUNCTION public.get_latest_season_backup_for_session(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_latest_season_backup_for_session(uuid, text) TO anon, authenticated;
