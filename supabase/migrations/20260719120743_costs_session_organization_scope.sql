-- Costs session-RPC's: altijd scopen op organization_id uit sessie (SuperAdmin = acting org).
-- Bodies zitten in private.*; public.* zijn thin invoker wrappers.

CREATE OR REPLACE FUNCTION private.get_costs_for_session(
  p_session_token uuid,
  p_category text DEFAULT NULL
)
RETURNS TABLE(
  id integer,
  name text,
  amount numeric,
  category text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_org_id integer;
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role = '' OR v_role <> 'admin' OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT c.id, c.name::text, c.amount, c.category::text
  FROM public.costs c
  WHERE c.organization_id = v_org_id
    AND (p_category IS NULL OR c.category::text = p_category)
  ORDER BY c.category, c.name;
END;
$$;

CREATE OR REPLACE FUNCTION private.get_team_costs_revision_for_session(
  p_session_token uuid
)
RETURNS TABLE(
  row_count bigint,
  max_id bigint,
  amount_sum numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_org_id integer;
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role = '' OR v_role <> 'admin' OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    count(*)::bigint,
    coalesce(max(tc.id), 0)::bigint,
    coalesce(sum(tc.amount), 0)::numeric
  FROM public.team_costs tc
  WHERE tc.organization_id = v_org_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.manage_cost_settings_for_session(
  p_session_token uuid,
  p_operation text,
  p_id integer DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_amount numeric DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_cascade_amount boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_org_id integer;
  v_rows integer;
  v_new_id integer;
BEGIN
  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role <> 'admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  IF p_operation = 'insert' THEN
    INSERT INTO public.costs (name, amount, category, organization_id)
    VALUES (p_name, p_amount, p_category, v_org_id)
    RETURNING id INTO v_new_id;
    RETURN jsonb_build_object('success', true, 'id', v_new_id);

  ELSIF p_operation = 'update' THEN
    UPDATE public.costs
    SET
      name = COALESCE(p_name, name),
      amount = COALESCE(p_amount, amount),
      category = COALESCE(p_category, category)
    WHERE id = p_id
      AND organization_id = v_org_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Tarief niet gevonden');
    END IF;
    IF p_cascade_amount AND p_amount IS NOT NULL THEN
      UPDATE public.team_costs
      SET amount = p_amount
      WHERE cost_setting_id = p_id
        AND organization_id = v_org_id;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      RETURN jsonb_build_object('success', true, 'updated_transactions', v_rows);
    END IF;
    RETURN jsonb_build_object('success', true);

  ELSIF p_operation = 'delete' THEN
    DELETE FROM public.costs
    WHERE id = p_id
      AND organization_id = v_org_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Tarief niet gevonden');
    END IF;
    RETURN jsonb_build_object('success', true);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Onbekende operatie');
END;
$$;

CREATE OR REPLACE FUNCTION private.add_team_cost_for_session(
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
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_username text;
  v_team_ids integer[];
  v_org_id integer;
  v_new_id integer;
  v_category text;
  v_cost_name text;
BEGIN
  SELECT s.user_id, s.role, s.username, s.team_ids, s.organization_id
  INTO v_user_id, v_role, v_username, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geen actieve sessie');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.team_id = p_team_id AND t.organization_id = v_org_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team niet gevonden');
  END IF;

  SELECT c.category::text, trim(c.name)
  INTO v_category, v_cost_name
  FROM public.costs c
  WHERE c.id = p_cost_setting_id
    AND c.organization_id = v_org_id;

  IF v_category IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kosttype niet gevonden');
  END IF;

  IF p_match_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.match_id = p_match_id AND m.organization_id = v_org_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd niet gevonden');
  END IF;

  IF v_role = 'admin' THEN
    NULL;
  ELSIF v_role = 'referee' AND v_category = 'penalty' AND p_match_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.match_id = p_match_id
        AND m.organization_id = v_org_id
        AND (m.assigned_referee_id = v_user_id OR (m.referee IS NOT NULL AND m.referee <> '' AND m.referee = v_username))
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Geen rechten om boete toe te voegen voor deze wedstrijd (niet toegewezen als scheids).');
    END IF;
  ELSIF v_role = 'player_manager' AND v_category = 'penalty' AND p_match_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.match_id = p_match_id
        AND m.organization_id = v_org_id
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
    INSERT INTO public.team_costs (team_id, cost_setting_id, amount, transaction_date, match_id, organization_id)
    VALUES (p_team_id, p_cost_setting_id, p_amount, COALESCE(p_transaction_date::date, CURRENT_DATE), p_match_id, v_org_id)
    ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
    DO UPDATE SET amount = EXCLUDED.amount, transaction_date = EXCLUDED.transaction_date
    RETURNING id INTO v_new_id;
  ELSE
    INSERT INTO public.team_costs (team_id, cost_setting_id, amount, transaction_date, match_id, organization_id)
    VALUES (p_team_id, p_cost_setting_id, p_amount, COALESCE(p_transaction_date::date, CURRENT_DATE), NULL, v_org_id)
    RETURNING id INTO v_new_id;
  END IF;

  IF v_category = 'penalty' AND p_match_id IS NOT NULL AND public.cost_name_implies_match_cost_suppression(v_cost_name) THEN
    DELETE FROM public.team_costs tc
    USING public.costs c
    WHERE tc.match_id = p_match_id
      AND tc.organization_id = v_org_id
      AND tc.cost_setting_id = c.id
      AND c.category = 'match_cost';
  END IF;

  IF v_category = 'penalty' AND p_match_id IS NOT NULL AND public.cost_name_is_forfait_verwittigd(v_cost_name) THEN
    DELETE FROM public.referee_assignments WHERE match_id = p_match_id;
    UPDATE public.matches
    SET assigned_referee_id = NULL, referee = NULL
    WHERE match_id = p_match_id
      AND organization_id = v_org_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Kost succesvol toegevoegd', 'id', v_new_id);
END;
$$;

CREATE OR REPLACE FUNCTION private.manage_team_cost_for_session(
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
  v_org_id integer;
  v_cost_record record;
  v_match_id integer;
  v_affected integer;
BEGIN
  SELECT s.user_id, s.role, s.username, s.organization_id
  INTO v_user_id, v_role, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geen actieve sessie');
  END IF;

  SELECT tc.id, tc.match_id, tc.team_id, tc.amount, tc.cost_setting_id
  INTO v_cost_record
  FROM public.team_costs tc
  WHERE tc.id = p_cost_id
    AND tc.organization_id = v_org_id;

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
        AND m.organization_id = v_org_id
        AND (m.assigned_referee_id = v_user_id OR m.referee = v_username)
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Je bent niet toegewezen als scheidsrechter voor deze wedstrijd');
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Onvoldoende rechten');
  END IF;

  IF p_team_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.team_id = p_team_id AND t.organization_id = v_org_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team niet gevonden');
  END IF;

  IF p_cost_setting_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.costs c
    WHERE c.id = p_cost_setting_id AND c.organization_id = v_org_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kosttype niet gevonden');
  END IF;

  IF p_operation = 'delete' THEN
    DELETE FROM public.team_costs
    WHERE id = p_cost_id
      AND organization_id = v_org_id;
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
    WHERE id = p_cost_id
      AND organization_id = v_org_id;
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

CREATE OR REPLACE FUNCTION private.get_team_balance_for_session(
  p_session_token uuid,
  p_team_id integer
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_team_ids integer[];
  v_org_id integer;
BEGIN
  SELECT s.role, s.team_ids, s.organization_id
  INTO v_role, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.team_id = p_team_id AND t.organization_id = v_org_id
  ) THEN
    RETURN NULL;
  END IF;

  IF v_role <> 'admin' AND (v_team_ids IS NULL OR NOT (p_team_id = ANY(v_team_ids))) THEN
    RETURN NULL;
  END IF;

  RETURN public.calculate_team_balance_updated(p_team_id);
END;
$$;
