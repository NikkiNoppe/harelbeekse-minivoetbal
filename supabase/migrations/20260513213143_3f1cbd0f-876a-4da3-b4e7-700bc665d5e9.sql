-- 1) Drop indexes op is_active
DROP INDEX IF EXISTS public.idx_costs_active;
DROP INDEX IF EXISTS public.idx_costs_category_active;

-- 2) Recreate functions zonder is_active referenties

CREATE OR REPLACE FUNCTION public.match_has_forfait_penalty(p_match_id integer)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_costs tc
    JOIN public.costs c ON c.id = tc.cost_setting_id
    WHERE tc.match_id = p_match_id
      AND c.category = 'penalty'
      AND public.cost_name_implies_match_cost_suppression(c.name)
  );
$function$;

CREATE OR REPLACE FUNCTION public.trg_match_cost_delete_sets_skip_auto()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.match_id IS NULL OR OLD.cost_setting_id IS NULL THEN
    RETURN OLD;
  END IF;

  IF public.match_has_forfait_penalty(OLD.match_id) THEN
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.costs c
    WHERE c.id = OLD.cost_setting_id
      AND c.category = 'match_cost'
  ) THEN
    UPDATE public.matches
    SET skip_auto_match_costs = true
    WHERE match_id = OLD.match_id;
  END IF;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_strip_match_costs_on_forfait_penalty()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.match_id IS NULL OR NEW.cost_setting_id IS NULL THEN
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
      AND c.category = 'match_cost';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_team_cost_as_admin(p_user_id integer, p_team_id integer, p_cost_setting_id integer, p_amount numeric, p_transaction_date date DEFAULT CURRENT_DATE, p_match_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_new_id integer;
  v_category text;
  v_cost_name text;
BEGIN
  SELECT u.role::text INTO v_role FROM public.users u WHERE u.user_id = p_user_id;

  IF v_role IS NULL AND p_user_id = -1 THEN
    v_role := 'admin';
  END IF;

  IF v_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gebruiker niet gevonden');
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
      SELECT 1
      FROM public.matches m
      JOIN public.users u ON u.user_id = p_user_id
      WHERE m.match_id = p_match_id
        AND (
          m.assigned_referee_id = u.user_id
          OR (m.referee IS NOT NULL AND m.referee <> '' AND m.referee = u.username)
        )
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Geen rechten om boete toe te voegen voor deze wedstrijd (niet toegewezen als scheids).'
      );
    END IF;
  ELSIF v_role = 'player_manager' AND v_category = 'penalty' AND p_match_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.team_users tu ON tu.user_id = p_user_id AND tu.team_id = p_team_id
      WHERE m.match_id = p_match_id
        AND p_team_id IS NOT NULL
        AND (m.home_team_id = p_team_id OR m.away_team_id = p_team_id)
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Geen rechten om deze boete toe te voegen (alleen voor je eigen ploeg op deze wedstrijd).'
      );
    END IF;
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Alleen admins kunnen deze kost toevoegen (of als scheids alleen boetes voor jouw wedstrijd).'
    );
  END IF;

  IF p_match_id IS NOT NULL THEN
    INSERT INTO public.team_costs (team_id, cost_setting_id, amount, transaction_date, match_id)
    VALUES (
      p_team_id,
      p_cost_setting_id,
      p_amount,
      COALESCE(p_transaction_date::date, CURRENT_DATE),
      p_match_id
    )
    ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
    DO UPDATE SET
      amount = EXCLUDED.amount,
      transaction_date = EXCLUDED.transaction_date
    RETURNING id INTO v_new_id;
  ELSE
    INSERT INTO public.team_costs (team_id, cost_setting_id, amount, transaction_date, match_id)
    VALUES (
      p_team_id,
      p_cost_setting_id,
      p_amount,
      COALESCE(p_transaction_date::date, CURRENT_DATE),
      NULL
    )
    RETURNING id INTO v_new_id;
  END IF;

  IF v_category = 'penalty'
     AND p_match_id IS NOT NULL
     AND public.cost_name_implies_match_cost_suppression(v_cost_name) THEN
    DELETE FROM public.team_costs tc
    USING public.costs c
    WHERE tc.match_id = p_match_id
      AND tc.cost_setting_id = c.id
      AND c.category = 'match_cost';
  END IF;

  IF v_category = 'penalty'
     AND p_match_id IS NOT NULL
     AND public.cost_name_is_forfait_verwittigd(v_cost_name) THEN
    DELETE FROM public.referee_assignments WHERE match_id = p_match_id;
    UPDATE public.matches
    SET assigned_referee_id = NULL,
        referee = NULL
    WHERE match_id = p_match_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Kost succesvol toegevoegd',
    'id', v_new_id
  );
END;
$function$;

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

  IF public.match_has_forfait_penalty(NEW.match_id) THEN
    DELETE FROM public.team_costs tc
    USING public.costs c
    WHERE tc.match_id = NEW.match_id
      AND tc.cost_setting_id = c.id
      AND c.category = 'match_cost';
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
    DELETE FROM public.team_costs
    WHERE match_id = NEW.match_id
      AND cost_setting_id IN (
        SELECT id FROM public.costs WHERE category = 'match_cost'
      );
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

-- 3) Drop alle overloads van insert_transaction_with_auto_data (dood/inconsistent: refereert is_active en niet-bestaande tabel team_transactions)
DROP FUNCTION IF EXISTS public.insert_transaction_with_auto_data(integer, character varying, numeric, text, integer);
DROP FUNCTION IF EXISTS public.insert_transaction_with_auto_data(integer, integer, character varying, numeric, text, integer);
DROP FUNCTION IF EXISTS public.insert_transaction_with_auto_data(integer, integer, numeric, date, integer, text);

-- 4) Drop kolommen
ALTER TABLE public.costs DROP COLUMN IF EXISTS description;
ALTER TABLE public.costs DROP COLUMN IF EXISTS is_active;