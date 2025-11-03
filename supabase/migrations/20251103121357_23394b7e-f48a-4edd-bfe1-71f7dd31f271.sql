-- DROP en RECREATE trigger om zeker te zijn dat de nieuwe functie gebruikt wordt
DROP TRIGGER IF EXISTS trigger_process_match_costs ON matches;

-- Maak de trigger opnieuw aan
CREATE TRIGGER trigger_process_match_costs
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION process_match_financial_costs();

-- Test of de cost IDs gevonden kunnen worden
DO $$
DECLARE
  veld_id INT;
  ref_id INT;
BEGIN
  SELECT id INTO veld_id FROM costs WHERE name = 'Veldkosten' AND category = 'match_cost' AND is_active = true LIMIT 1;
  SELECT id INTO ref_id FROM costs WHERE name = 'Scheidsrechterkosten' AND category = 'match_cost' AND is_active = true LIMIT 1;
  
  RAISE NOTICE 'Veldkosten ID: %', veld_id;
  RAISE NOTICE 'Scheidsrechterkosten ID: %', ref_id;
  
  IF veld_id IS NULL OR ref_id IS NULL THEN
    RAISE EXCEPTION 'Cost settings not found! Veld: %, Ref: %', veld_id, ref_id;
  END IF;
END $$;