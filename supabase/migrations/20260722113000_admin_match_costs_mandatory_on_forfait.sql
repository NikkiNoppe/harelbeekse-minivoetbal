-- Administratiekosten blijven per wedstrijd staan, ook bij forfait.

CREATE OR REPLACE FUNCTION public.cost_name_is_admin_match_cost(p_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(coalesce(p_name, ''))) LIKE '%administratie%'
      OR lower(trim(coalesce(p_name, ''))) LIKE '%admin%';
$$;

GRANT EXECUTE ON FUNCTION public.cost_name_is_admin_match_cost(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.trg_strip_match_costs_on_forfait_penalty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  IF NEW.match_id IS NULL OR NEW.cost_setting_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.match_played_with_scores(NEW.match_id) THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.costs c
    WHERE c.id = NEW.cost_setting_id
      AND c.category = 'penalty'
      AND public.cost_name_implies_match_cost_suppression(c.name)
  ) THEN
    DELETE FROM public.team_costs tc
    USING public.costs c
    WHERE tc.match_id = NEW.match_id
      AND tc.cost_setting_id = c.id
      AND c.category = 'match_cost'
      AND NOT public.cost_name_is_admin_match_cost(c.name);
  END IF;

  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.process_match_financial_costs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  veld_cost_id INT;
  referee_cost_id INT;
  admin_cost_id INT;
  veld_am NUMERIC;
  ref_am NUMERIC;
  admin_am NUMERIC;
  tx_date date;
BEGIN
  tx_date := COALESCE(
    CASE
      WHEN NEW.match_date IS NULL THEN NULL
      ELSE left(NEW.match_date::text, 10)::date
    END,
    CURRENT_DATE
  );

  IF public.match_has_forfait_penalty(NEW.match_id)
     AND NOT public.match_played_with_scores(NEW.match_id) THEN
    DELETE FROM public.team_costs tc
    USING public.costs c
    WHERE tc.match_id = NEW.match_id
      AND tc.cost_setting_id = c.id
      AND c.category = 'match_cost'
      AND NOT public.cost_name_is_admin_match_cost(c.name);

    SELECT id, amount INTO admin_cost_id, admin_am FROM public.costs
    WHERE name = 'Administratiekosten' AND category = 'match_cost'
    LIMIT 1;

    IF admin_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
      VALUES (NEW.home_team_id, admin_cost_id, NEW.match_id, tx_date, admin_am)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
      DO UPDATE SET amount = EXCLUDED.amount, transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;

      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
      VALUES (NEW.away_team_id, admin_cost_id, NEW.match_id, tx_date, admin_am)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
      DO UPDATE SET amount = EXCLUDED.amount, transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;
    END IF;

    RETURN NEW;
  END IF;

  SELECT id, amount INTO veld_cost_id, veld_am FROM public.costs
  WHERE name = 'Veldkosten' AND category = 'match_cost'
  LIMIT 1;

  SELECT id, amount INTO referee_cost_id, ref_am FROM public.costs
  WHERE name = 'Scheidsrechterkosten' AND category = 'match_cost'
  LIMIT 1;

  SELECT id, amount INTO admin_cost_id, admin_am FROM public.costs
  WHERE name = 'Administratiekosten' AND category = 'match_cost'
  LIMIT 1;

  IF NEW.home_score IS NULL AND NEW.away_score IS NULL THEN
    DELETE FROM public.team_costs tc
    USING public.costs c
    WHERE tc.match_id = NEW.match_id
      AND tc.cost_setting_id = c.id
      AND c.category = 'match_cost'
      AND NOT public.cost_name_is_admin_match_cost(c.name);
    RETURN NEW;
  END IF;

  IF NEW.is_submitted = true
     AND (OLD.is_submitted = false OR OLD.is_submitted IS NULL)
     AND NEW.home_score IS NOT NULL
     AND NEW.away_score IS NOT NULL
  THEN
    IF COALESCE(NEW.skip_auto_match_costs, false) THEN
      RETURN NEW;
    END IF;

    IF NEW.assigned_referee_id IS NULL AND referee_cost_id IS NOT NULL THEN
      DELETE FROM public.team_costs
      WHERE match_id = NEW.match_id
        AND cost_setting_id = referee_cost_id;
    END IF;

    IF veld_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
      VALUES (NEW.home_team_id, veld_cost_id, NEW.match_id, tx_date, veld_am)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
      DO UPDATE SET amount = EXCLUDED.amount, transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;
    END IF;

    IF admin_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
      VALUES (NEW.home_team_id, admin_cost_id, NEW.match_id, tx_date, admin_am)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
      DO UPDATE SET amount = EXCLUDED.amount, transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;
    END IF;

    IF NEW.assigned_referee_id IS NOT NULL AND referee_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
      VALUES (NEW.home_team_id, referee_cost_id, NEW.match_id, tx_date, ref_am)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
      DO UPDATE SET amount = EXCLUDED.amount, transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;
    END IF;

    IF veld_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
      VALUES (NEW.away_team_id, veld_cost_id, NEW.match_id, tx_date, veld_am)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
      DO UPDATE SET amount = EXCLUDED.amount, transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;
    END IF;

    IF admin_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
      VALUES (NEW.away_team_id, admin_cost_id, NEW.match_id, tx_date, admin_am)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
      DO UPDATE SET amount = EXCLUDED.amount, transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;
    END IF;

    IF NEW.assigned_referee_id IS NOT NULL AND referee_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
      VALUES (NEW.away_team_id, referee_cost_id, NEW.match_id, tx_date, ref_am)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
      DO UPDATE SET amount = EXCLUDED.amount, transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

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
  v_cost_name text;
  v_cost_category text;
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

  SELECT tc.id, tc.match_id, tc.team_id, tc.amount, tc.cost_setting_id, c.name, c.category
  INTO v_cost_record
  FROM public.team_costs tc
  LEFT JOIN public.costs c ON c.id = tc.cost_setting_id
  WHERE tc.id = p_cost_id
    AND tc.organization_id = v_org_id;

  IF v_cost_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kost niet gevonden');
  END IF;

  v_cost_name := v_cost_record.name;
  v_cost_category := v_cost_record.category;
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
    IF v_cost_category = 'match_cost'
       AND public.cost_name_is_admin_match_cost(v_cost_name) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Administratiekosten kunnen niet worden verwijderd'
      );
    END IF;

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
