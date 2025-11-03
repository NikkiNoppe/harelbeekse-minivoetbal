-- Add extensive logging to process_match_financial_costs trigger
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

  -- Gebruik de helper functie om bestaande kosten te verwijderen
  RAISE NOTICE '🟣 [TRIGGER] Calling delete_team_costs_for_match(match_id=%, cost_ids=%)', 
    NEW.match_id, ARRAY[v_veld_cost_id, v_ref_cost_id];
  PERFORM public.delete_team_costs_for_match(NEW.match_id, ARRAY[v_veld_cost_id, v_ref_cost_id]);
  RAISE NOTICE '🟣 [TRIGGER] Delete completed';

  -- Voeg kosten toe voor home team
  RAISE NOTICE '🟣 [TRIGGER] Inserting costs for home_team_id=%', NEW.home_team_id;
  INSERT INTO public.team_costs (team_id, match_id, transaction_date, cost_setting_id, amount)
  VALUES 
    (NEW.home_team_id, NEW.match_id, v_match_date, v_veld_cost_id, v_veld_amount),
    (NEW.home_team_id, NEW.match_id, v_match_date, v_ref_cost_id, v_ref_amount);
  RAISE NOTICE '🟣 [TRIGGER] Home team costs inserted';

  -- Voeg kosten toe voor away team
  RAISE NOTICE '🟣 [TRIGGER] Inserting costs for away_team_id=%', NEW.away_team_id;
  INSERT INTO public.team_costs (team_id, match_id, transaction_date, cost_setting_id, amount)
  VALUES 
    (NEW.away_team_id, NEW.match_id, v_match_date, v_veld_cost_id, v_veld_amount),
    (NEW.away_team_id, NEW.match_id, v_match_date, v_ref_cost_id, v_ref_amount);
  RAISE NOTICE '🟣 [TRIGGER] Away team costs inserted';

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

-- Add logging to delete_team_costs_for_match helper
CREATE OR REPLACE FUNCTION public.delete_team_costs_for_match(
  p_match_id INTEGER,
  p_cost_setting_ids INTEGER[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  RAISE NOTICE '🟣 [HELPER delete_team_costs_for_match] ========== START ==========';
  RAISE NOTICE '🟣 [HELPER] Match ID: %, Cost Setting IDs: %', p_match_id, p_cost_setting_ids;
  RAISE NOTICE '🟣 [HELPER] About to DELETE from team_costs WHERE match_id = % AND cost_setting_id = ANY(%)', 
    p_match_id, p_cost_setting_ids;
  
  -- Check existing records before delete
  SELECT COUNT(*) INTO v_deleted_count
  FROM public.team_costs
  WHERE match_id = p_match_id 
    AND cost_setting_id = ANY(p_cost_setting_ids);
  
  RAISE NOTICE '🟣 [HELPER] Found % existing records to delete', v_deleted_count;
  
  -- Perform the delete
  DELETE FROM public.team_costs
  WHERE match_id = p_match_id 
    AND cost_setting_id = ANY(p_cost_setting_ids);
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE '🟣 [HELPER] Deleted % records', v_deleted_count;
  RAISE NOTICE '🟣 [HELPER] ========== END ==========';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ [HELPER] Error in delete_team_costs_for_match: %', SQLERRM;
    RAISE WARNING '❌ [HELPER] Error details: SQLSTATE=%, SQLERRM=%', SQLSTATE, SQLERRM;
    RAISE NOTICE '🟣 [HELPER] ========== END (error) ==========';
    RAISE;
END;
$$;