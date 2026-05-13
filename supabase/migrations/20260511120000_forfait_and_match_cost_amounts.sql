-- Forfait: geen veld/scheids/admin wedstrijdkosten (alleen boete).
-- Trigger vulde team_costs.match_cost zonder amount → rapport €0,00; nu expliciet amount + tx-datum uit wedstrijd.

CREATE OR REPLACE FUNCTION public.match_has_forfait_penalty(p_match_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_costs tc
    JOIN public.costs c ON c.id = tc.cost_setting_id
    WHERE tc.match_id = p_match_id
      AND c.category = 'penalty'
      AND COALESCE(c.is_active, true)
      AND lower(trim(c.name)) LIKE '%forfait%'
  );
$$;

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

  IF EXISTS (
    SELECT 1 FROM public.costs c
    WHERE c.id = NEW.cost_setting_id
      AND c.category = 'penalty'
      AND COALESCE(c.is_active, true)
      AND lower(trim(c.name)) LIKE '%forfait%'
  ) THEN
    DELETE FROM public.team_costs tc
    USING public.costs c
    WHERE tc.match_id = NEW.match_id
      AND tc.cost_setting_id = c.id
      AND c.category = 'match_cost'
      AND COALESCE(c.is_active, true);
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_strip_match_costs_on_forfait_penalty ON public.team_costs;
CREATE TRIGGER trg_strip_match_costs_on_forfait_penalty
AFTER INSERT OR UPDATE OF cost_setting_id
ON public.team_costs
FOR EACH ROW
EXECUTE FUNCTION public.trg_strip_match_costs_on_forfait_penalty();

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

-- Bestaande rijen met NULL amount voor actieve match_cost-instellingen
UPDATE public.team_costs tc
SET amount = c.amount
FROM public.costs c
WHERE tc.cost_setting_id = c.id
  AND c.category = 'match_cost'
  AND COALESCE(c.is_active, true)
  AND tc.amount IS NULL;
