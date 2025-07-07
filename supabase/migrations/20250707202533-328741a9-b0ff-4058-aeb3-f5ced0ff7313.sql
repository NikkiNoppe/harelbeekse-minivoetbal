-- Process existing submitted matches to generate historical cost data
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
  
  -- Process all existing submitted matches that don't have cost transactions yet
  FOR match_record IN 
    SELECT m.* FROM matches m
    WHERE m.is_submitted = true 
    AND NOT EXISTS (
      SELECT 1 FROM team_transactions tt 
      WHERE tt.match_id = m.match_id 
      AND tt.transaction_type = 'match_cost'
    )
  LOOP
    -- Add field cost for home team
    INSERT INTO team_transactions (
      team_id, transaction_type, amount, description, 
      cost_setting_id, match_id, transaction_date
    ) VALUES (
      match_record.home_team_id, 'match_cost', field_cost_amount,
      'Veldkosten voor wedstrijd ' || COALESCE(match_record.unique_number, 'M' || match_record.match_id::text),
      field_cost_setting.id, match_record.match_id, CURRENT_DATE
    );
    
    -- Add referee cost for home team
    INSERT INTO team_transactions (
      team_id, transaction_type, amount, description,
      cost_setting_id, match_id, transaction_date
    ) VALUES (
      match_record.home_team_id, 'match_cost', referee_cost_amount,
      'Scheidsrechterkosten voor wedstrijd ' || COALESCE(match_record.unique_number, 'M' || match_record.match_id::text) ||
      CASE WHEN match_record.referee IS NOT NULL THEN ' (Scheidsrechter: ' || match_record.referee || ')' ELSE '' END,
      referee_cost_setting.id, match_record.match_id, CURRENT_DATE
    );
    
    -- Add field cost for away team
    INSERT INTO team_transactions (
      team_id, transaction_type, amount, description,
      cost_setting_id, match_id, transaction_date
    ) VALUES (
      match_record.away_team_id, 'match_cost', field_cost_amount,
      'Veldkosten voor wedstrijd ' || COALESCE(match_record.unique_number, 'M' || match_record.match_id::text),
      field_cost_setting.id, match_record.match_id, CURRENT_DATE
    );
    
    -- Add referee cost for away team  
    INSERT INTO team_transactions (
      team_id, transaction_type, amount, description,
      cost_setting_id, match_id, transaction_date
    ) VALUES (
      match_record.away_team_id, 'match_cost', referee_cost_amount,
      'Scheidsrechterkosten voor wedstrijd ' || COALESCE(match_record.unique_number, 'M' || match_record.match_id::text) ||
      CASE WHEN match_record.referee IS NOT NULL THEN ' (Scheidsrechter: ' || match_record.referee || ')' ELSE '' END,
      referee_cost_setting.id, match_record.match_id, CURRENT_DATE
    );
  END LOOP;
  
  -- Update all team balances
  PERFORM update_team_balances();
END $$;