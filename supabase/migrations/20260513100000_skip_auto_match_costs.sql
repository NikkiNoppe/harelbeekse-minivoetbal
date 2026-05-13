-- Na handmatig verwijderen van wedstrijdkosten (team_costs match_cost): geen automatische sync/backfill meer
-- tot admin dit expliciet reset.

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS skip_auto_match_costs boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.matches.skip_auto_match_costs IS
  'true = admin heeft standaard wedstrijdkosten verwijderd; geen auto sync/trigger insert tot reset.';

CREATE OR REPLACE FUNCTION public.trg_match_cost_delete_sets_skip_auto()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  IF OLD.match_id IS NULL OR OLD.cost_setting_id IS NULL THEN
    RETURN OLD;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.costs c
    WHERE c.id = OLD.cost_setting_id
      AND c.category = 'match_cost'
      AND COALESCE(c.is_active, true)
  ) THEN
    UPDATE public.matches
    SET skip_auto_match_costs = true
    WHERE match_id = OLD.match_id;
  END IF;
  RETURN OLD;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_match_cost_delete_skip_auto ON public.team_costs;
CREATE TRIGGER trg_match_cost_delete_skip_auto
AFTER DELETE ON public.team_costs
FOR EACH ROW
EXECUTE FUNCTION public.trg_match_cost_delete_sets_skip_auto();

CREATE OR REPLACE FUNCTION public.admin_clear_skip_auto_match_costs(p_match_id integer, p_user_id integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_role text;
BEGIN
  SELECT u.role::text INTO v_role FROM public.users u WHERE u.user_id = p_user_id;
  IF v_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gebruiker niet gevonden');
  END IF;
  IF v_role <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen dit resetten.');
  END IF;
  IF p_match_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldige wedstrijd');
  END IF;

  UPDATE public.matches
  SET skip_auto_match_costs = false
  WHERE match_id = p_match_id;

  RETURN jsonb_build_object('success', true);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.admin_clear_skip_auto_match_costs(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_clear_skip_auto_match_costs(integer, integer) TO service_role;

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
      AND c.category = 'match_cost'
      AND COALESCE(c.is_active, true);
    RETURN NEW;
  END IF;

  SELECT id, amount INTO veld_cost_id, veld_am FROM public.costs
  WHERE name = 'Veldkosten' AND category = 'match_cost' AND COALESCE(is_active, true)
  LIMIT 1;

  SELECT id, amount INTO referee_cost_id, ref_am FROM public.costs
  WHERE name = 'Scheidsrechterkosten' AND category = 'match_cost' AND COALESCE(is_active, true)
  LIMIT 1;

  SELECT id, amount INTO admin_cost_id, admin_am FROM public.costs
  WHERE name = 'Administratiekosten' AND category = 'match_cost' AND COALESCE(is_active, true)
  LIMIT 1;

  IF NEW.home_score IS NULL AND NEW.away_score IS NULL THEN
    DELETE FROM public.team_costs
    WHERE match_id = NEW.match_id
      AND cost_setting_id IN (
        SELECT id FROM public.costs WHERE category = 'match_cost' AND COALESCE(is_active, true)
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
      DO UPDATE SET
        amount = EXCLUDED.amount,
        transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount
         OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;
    END IF;

    IF admin_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
      VALUES (NEW.home_team_id, admin_cost_id, NEW.match_id, tx_date, admin_am)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
      DO UPDATE SET
        amount = EXCLUDED.amount,
        transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount
         OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;
    END IF;

    IF NEW.assigned_referee_id IS NOT NULL AND referee_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
      VALUES (NEW.home_team_id, referee_cost_id, NEW.match_id, tx_date, ref_am)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
      DO UPDATE SET
        amount = EXCLUDED.amount,
        transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount
         OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;
    END IF;

    IF veld_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
      VALUES (NEW.away_team_id, veld_cost_id, NEW.match_id, tx_date, veld_am)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
      DO UPDATE SET
        amount = EXCLUDED.amount,
        transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount
         OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;
    END IF;

    IF admin_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
      VALUES (NEW.away_team_id, admin_cost_id, NEW.match_id, tx_date, admin_am)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
      DO UPDATE SET
        amount = EXCLUDED.amount,
        transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount
         OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;
    END IF;

    IF NEW.assigned_referee_id IS NOT NULL AND referee_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
      VALUES (NEW.away_team_id, referee_cost_id, NEW.match_id, tx_date, ref_am)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL
      DO UPDATE SET
        amount = EXCLUDED.amount,
        transaction_date = EXCLUDED.transaction_date
      WHERE team_costs.amount IS DISTINCT FROM EXCLUDED.amount
         OR team_costs.transaction_date IS DISTINCT FROM EXCLUDED.transaction_date;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
