-- Fix: gebruik CASCADE om de functie met alle afhankelijkheden te droppen
DROP FUNCTION IF EXISTS process_match_financial_costs() CASCADE;

-- Maak een nieuwe functie die als postgres superuser draait
CREATE OR REPLACE FUNCTION process_match_financial_costs()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_veld_cost_id INTEGER;
  v_ref_cost_id INTEGER;
  v_veld_amount NUMERIC;
  v_ref_amount NUMERIC;
  v_match_date DATE;
BEGIN
  -- Skip als het geen submitted match is
  IF NEW.is_submitted = false OR NEW.home_score IS NULL OR NEW.away_score IS NULL THEN
    RETURN NEW;
  END IF;

  -- Skip als het een cup match is
  IF NEW.is_cup_match = true THEN
    RETURN NEW;
  END IF;

  -- Haal match datum op
  v_match_date := DATE(NEW.match_date);

  -- Haal cost IDs en amounts op
  SELECT id, amount INTO v_veld_cost_id, v_veld_amount
  FROM costs
  WHERE name = 'Veldkosten' 
    AND category = 'match_cost' 
    AND is_active = true
  LIMIT 1;

  SELECT id, amount INTO v_ref_cost_id, v_ref_amount
  FROM costs
  WHERE name = 'Scheidsrechterkosten' 
    AND category = 'match_cost' 
    AND is_active = true
  LIMIT 1;

  -- Skip als settings niet gevonden zijn
  IF v_veld_cost_id IS NULL OR v_ref_cost_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verwijder bestaande automatische kosten voor deze match
  DELETE FROM public.team_costs
  WHERE match_id = NEW.match_id 
    AND cost_setting_id IN (v_veld_cost_id, v_ref_cost_id);

  -- Voeg kosten toe voor home team
  INSERT INTO public.team_costs (team_id, match_id, transaction_date, cost_setting_id, amount)
  VALUES 
    (NEW.home_team_id, NEW.match_id, v_match_date, v_veld_cost_id, v_veld_amount),
    (NEW.home_team_id, NEW.match_id, v_match_date, v_ref_cost_id, v_ref_amount);

  -- Voeg kosten toe voor away team
  INSERT INTO public.team_costs (team_id, match_id, transaction_date, cost_setting_id, amount)
  VALUES 
    (NEW.away_team_id, NEW.match_id, v_match_date, v_veld_cost_id, v_veld_amount),
    (NEW.away_team_id, NEW.match_id, v_match_date, v_ref_cost_id, v_ref_amount);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in process_match_financial_costs: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Verander de owner van de functie naar postgres (superuser die RLS omzeilt)
ALTER FUNCTION process_match_financial_costs() OWNER TO postgres;

-- Geef postgres alle rechten op team_costs
GRANT ALL ON public.team_costs TO postgres;

-- Hermaak de trigger
CREATE TRIGGER process_match_costs_trigger
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  WHEN (NEW.is_submitted = true AND OLD.is_submitted = false)
  EXECUTE FUNCTION process_match_financial_costs();