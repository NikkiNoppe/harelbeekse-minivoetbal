-- Fix: Remove DELETE operation from process_match_financial_costs
-- New approach: Only INSERT costs if they don't already exist (idempotent)

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
  v_existing_costs_count INTEGER;
BEGIN
  RAISE NOTICE '🟣 [TRIGGER process_match_financial_costs] ========== START ==========';
  RAISE NOTICE '🟣 [TRIGGER] Match ID: %, is_submitted: %, home_score: %, away_score: %', 
    NEW.match_id, NEW.is_submitted, NEW.home_score, NEW.away_score;
  
  -- Skip als het geen submitted match is
  IF NEW.is_submitted = false OR NEW.home_score IS NULL OR NEW.away_score IS NULL THEN
    RAISE NOTICE '🟣 [TRIGGER] Skipping - match not submitted or no scores';
    RAISE NOTICE '🟣 [TRIGGER] ========== END (skipped) ==========';
    RETURN NEW;
  END IF;

  -- Skip als het een cup match is
  IF NEW.is_cup_match = true THEN
    RAISE NOTICE '🟣 [TRIGGER] Skipping - this is a cup match';
    RAISE NOTICE '🟣 [TRIGGER] ========== END (cup match) ==========';
    RETURN NEW;
  END IF;

  -- Haal match datum op
  v_match_date := DATE(NEW.match_date);
  RAISE NOTICE '🟣 [TRIGGER] Match date: %', v_match_date;

  -- Haal cost IDs en amounts op
  SELECT id, amount INTO v_veld_cost_id, v_veld_amount
  FROM costs
  WHERE name = 'Veldkosten' 
    AND category = 'match_cost' 
    AND is_active = true
  LIMIT 1;
  RAISE NOTICE '🟣 [TRIGGER] Veldkosten: id=%, amount=%', v_veld_cost_id, v_veld_amount;

  SELECT id, amount INTO v_ref_cost_id, v_ref_amount
  FROM costs
  WHERE name = 'Scheidsrechterkosten' 
    AND category = 'match_cost' 
    AND is_active = true
  LIMIT 1;
  RAISE NOTICE '🟣 [TRIGGER] Scheidsrechterkosten: id=%, amount=%', v_ref_cost_id, v_ref_amount;

  -- Skip als settings niet gevonden zijn
  IF v_veld_cost_id IS NULL OR v_ref_cost_id IS NULL THEN
    RAISE NOTICE '🟣 [TRIGGER] Cost settings not found, skipping';
    RAISE NOTICE '🟣 [TRIGGER] ========== END (no settings) ==========';
    RETURN NEW;
  END IF;

  -- Check of er al kosten zijn voor deze match
  SELECT COUNT(*) INTO v_existing_costs_count
  FROM public.team_costs
  WHERE match_id = NEW.match_id 
    AND cost_setting_id IN (v_veld_cost_id, v_ref_cost_id);
  
  RAISE NOTICE '🟣 [TRIGGER] Found % existing costs for this match', v_existing_costs_count;

  -- Alleen toevoegen als er nog geen kosten zijn
  IF v_existing_costs_count = 0 THEN
    RAISE NOTICE '🟣 [TRIGGER] No existing costs found, inserting new costs';
    
    -- Voeg kosten toe voor home team
    INSERT INTO public.team_costs (team_id, match_id, transaction_date, cost_setting_id, amount)
    VALUES 
      (NEW.home_team_id, NEW.match_id, v_match_date, v_veld_cost_id, v_veld_amount),
      (NEW.home_team_id, NEW.match_id, v_match_date, v_ref_cost_id, v_ref_amount);
    RAISE NOTICE '🟣 [TRIGGER] Home team costs inserted';

    -- Voeg kosten toe voor away team
    INSERT INTO public.team_costs (team_id, match_id, transaction_date, cost_setting_id, amount)
    VALUES 
      (NEW.away_team_id, NEW.match_id, v_match_date, v_veld_cost_id, v_veld_amount),
      (NEW.away_team_id, NEW.match_id, v_match_date, v_ref_cost_id, v_ref_amount);
    RAISE NOTICE '🟣 [TRIGGER] Away team costs inserted';
  ELSE
    RAISE NOTICE '🟣 [TRIGGER] Costs already exist for this match, skipping insert';
  END IF;

  RAISE NOTICE '🟣 [TRIGGER] ========== END (success) ==========';
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ [TRIGGER] Error in process_match_financial_costs: %', SQLERRM;
    RAISE WARNING '❌ [TRIGGER] Error details: SQLSTATE=%, SQLERRM=%', SQLSTATE, SQLERRM;
    RAISE NOTICE '🟣 [TRIGGER] ========== END (error) ==========';
    RETURN NEW;
END;
$$;