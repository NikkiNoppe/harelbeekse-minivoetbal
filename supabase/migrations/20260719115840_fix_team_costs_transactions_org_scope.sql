-- Financiën: SuperAdmin (user_id = -1) mag team_costs niet cross-tenant lezen.
-- Fix: altijd filteren op organization_id uit sessie (acting_organization_id)
-- én p_team_id respecteren (detail-modal toonde anders Harelbeke-historiek bij Kuurne-teams).

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
    at.team_name::text
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
  ORDER BY tc.transaction_date DESC, tc.id DESC;
END;
$$;

COMMENT ON FUNCTION public.get_team_costs_transactions(uuid, integer) IS
  'Team-kosten/transacties voor actieve organization_id (SuperAdmin via acting_organization_id).';

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

  IF v_role = 'admin' THEN
    v_allowed := true;
  ELSIF v_role = 'referee' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.match_id = p_match_id
        AND m.organization_id = v_org_id
        AND (
          m.assigned_referee_id = v_user_id
          OR m.referee = COALESCE(v_username, '')
        )
    ) INTO v_allowed;
  ELSIF v_role = 'player_manager' AND v_team_ids IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.match_id = p_match_id
        AND m.organization_id = v_org_id
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
    AND tc.organization_id = v_org_id
    AND (
      v_role IN ('admin', 'referee')
      OR tc.team_id = ANY(v_team_ids)
    )
  ORDER BY tc.team_id ASC, tc.id ASC;
END;
$$;

COMMENT ON FUNCTION public.get_team_costs_for_match(uuid, integer) IS
  'Team-kosten per wedstrijd, gescoped op actieve organization_id.';

REVOKE ALL ON FUNCTION public.get_team_costs_for_match(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_costs_for_match(uuid, integer) TO anon, authenticated;
