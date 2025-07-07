-- Fix the migration to ensure proper cost_setting_id for referee costs
DO $$
DECLARE
  match_record RECORD;
  field_cost_setting RECORD;
  referee_cost_setting RECORD;
  field_cost_amount DECIMAL(10,2) := 5.00;
  referee_cost_amount DECIMAL(10,2) := 6.00;
BEGIN
  -- Get current cost settings
  SELECT * INTO field_cost_setting 
  FROM cost_settings 
  WHERE category = 'match_cost' 
  AND name ILIKE '%veld%' 
  AND is_active = true 
  LIMIT 1;
  
  SELECT * INTO referee_cost_setting
  FROM cost_settings 
  WHERE category = 'match_cost' 
  AND name ILIKE '%scheidsrechter%' 
  AND is_active = true 
  LIMIT 1;
  
  -- Use found costs or defaults
  IF field_cost_setting.id IS NOT NULL THEN
    field_cost_amount := field_cost_setting.amount;
  END IF;
  
  IF referee_cost_setting.id IS NOT NULL THEN
    referee_cost_amount := referee_cost_setting.amount;
  END IF;
  
  -- Update existing NULL cost_setting_id values for referee costs
  UPDATE team_transactions 
  SET cost_setting_id = referee_cost_setting.id
  WHERE transaction_type = 'match_cost' 
  AND cost_setting_id IS NULL 
  AND (description ILIKE '%scheidsrechter%' OR description ILIKE '%referee%');
  
  -- Update existing NULL cost_setting_id values for field costs
  UPDATE team_transactions 
  SET cost_setting_id = field_cost_setting.id
  WHERE transaction_type = 'match_cost' 
  AND cost_setting_id IS NULL 
  AND (description ILIKE '%veld%' OR description ILIKE '%field%');
  
  -- Update all team balances
  PERFORM update_team_balances();
END $$;