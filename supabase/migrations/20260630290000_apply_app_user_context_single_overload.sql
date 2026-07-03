-- Fix: "function public.apply_app_user_context(text, integer, text, text) is not unique"
-- Oorzaak: oude 4-arg overload naast 5-arg (organization_id) overload na multi-tenant migratie.

DROP FUNCTION IF EXISTS public.apply_app_user_context(text, integer, text, text);

CREATE OR REPLACE FUNCTION public.apply_app_user_context(
  p_role text,
  p_user_id integer,
  p_team_ids text,
  p_username text DEFAULT '',
  p_organization_id integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_organization_id integer := p_organization_id;
BEGIN
  IF v_organization_id IS NULL AND p_user_id IS NOT NULL AND p_user_id > 0 THEN
    SELECT u.organization_id
    INTO v_organization_id
    FROM public.users u
    WHERE u.user_id = p_user_id;
  END IF;

  PERFORM public.clear_app_user_context();
  PERFORM set_config('app.current_user_role', COALESCE(p_role, ''), true);
  PERFORM set_config('app.current_user_id', COALESCE(p_user_id::text, ''), true);
  PERFORM set_config('app.current_user_team_ids', COALESCE(p_team_ids, ''), true);
  PERFORM set_config('app.current_user_username', COALESCE(p_username, ''), true);
  PERFORM set_config(
    'app.current_organization_id',
    COALESCE(v_organization_id::text, ''),
    true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_app_user_context(text, integer, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_app_user_context(text, integer, text, text, integer) TO service_role;

-- Wedstrijdformulieren: resolve_app_session + expliciete org-context
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

  IF v_role IS NULL OR v_role = '' THEN
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
  WHERE (
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
    v_user_id = -1
    OR v_role <> 'admin'
    OR m.organization_id = v_org_id
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

REVOKE ALL ON FUNCTION public.get_matches_for_forms(uuid, integer, boolean, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_matches_for_forms(uuid, integer, boolean, text, integer, text) TO anon, authenticated;

-- Financiën: zelfde sessie-helper + expliciete org-context
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
  away_team_name text
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

  IF v_role IS NULL OR v_role = '' THEN
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
    at.team_name::text
  FROM public.team_costs tc
  JOIN public.costs c ON c.id = tc.cost_setting_id
  LEFT JOIN public.matches m ON m.match_id = tc.match_id
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  WHERE (
    v_user_id = -1
    OR (
      v_role = 'admin'
      AND tc.organization_id = v_org_id
      AND (p_team_id IS NULL OR tc.team_id = p_team_id)
    )
    OR (
      v_role = 'player_manager'
      AND tc.team_id = ANY(v_team_ids)
      AND (p_team_id IS NULL OR tc.team_id = p_team_id)
    )
  )
  ORDER BY tc.transaction_date DESC, tc.id DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_team_costs_transactions(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_costs_transactions(uuid, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_team_costs_for_match(
  p_session_token uuid,
  p_match_id integer
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
  cost_default_amount numeric
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
  v_allowed boolean := false;
BEGIN
  IF p_session_token IS NULL OR p_match_id IS NULL THEN
    RETURN;
  END IF;

  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role = '' THEN
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

  IF v_role = 'admin' THEN
    v_allowed := true;
  ELSIF v_role = 'referee' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.match_id = p_match_id
        AND (
          m.assigned_referee_id = v_user_id
          OR m.referee = COALESCE(v_username, '')
        )
    ) INTO v_allowed;
  ELSIF v_role = 'player_manager' AND v_team_ids IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.match_id = p_match_id
        AND (m.home_team_id = ANY(v_team_ids) OR m.away_team_id = ANY(v_team_ids))
    ) INTO v_allowed;
  END IF;

  IF NOT v_allowed THEN
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
    c.amount
  FROM public.team_costs tc
  JOIN public.costs c ON c.id = tc.cost_setting_id
  WHERE tc.match_id = p_match_id
    AND (
      v_user_id = -1
      OR v_role = 'referee'
      OR tc.team_id = ANY(v_team_ids)
      OR (v_role = 'admin' AND tc.organization_id = v_org_id)
    )
  ORDER BY tc.team_id ASC, tc.id ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_team_costs_for_match(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_costs_for_match(uuid, integer) TO anon, authenticated;
