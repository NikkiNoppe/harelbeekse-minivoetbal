-- Maak een SECURITY DEFINER helper functie voor het veilig verwijderen van team costs
CREATE OR REPLACE FUNCTION public.delete_team_costs_for_match(
  p_match_id INTEGER,
  p_cost_setting_ids INTEGER[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Deze functie draait met elevated privileges en bypassed RLS
  DELETE FROM public.team_costs
  WHERE match_id = p_match_id 
    AND cost_setting_id = ANY(p_cost_setting_ids);
END;
$$;

-- Update de trigger functie om de helper te gebruiken
CREATE OR REPLACE FUNCTION public.process_match_financial_costs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
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

  -- Gebruik de helper functie om bestaande kosten te verwijderen
  PERFORM public.delete_team_costs_for_match(NEW.match_id, ARRAY[v_veld_cost_id, v_ref_cost_id]);

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