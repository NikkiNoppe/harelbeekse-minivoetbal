-- Create function to automatically add match costs when a match form is submitted
CREATE OR REPLACE FUNCTION public.process_match_costs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  field_cost_setting RECORD;
  referee_cost_setting RECORD;
  field_cost_amount DECIMAL(10,2) := 5.00;
  referee_cost_amount DECIMAL(10,2) := 6.00;
BEGIN
  -- Only process when match is newly submitted
  IF NEW.is_submitted = true AND (OLD.is_submitted = false OR OLD.is_submitted IS NULL) THEN
    
    -- Get current field cost from cost_settings
    SELECT * INTO field_cost_setting 
    FROM cost_settings 
    WHERE category = 'match_cost' 
    AND name ILIKE '%veld%' 
    AND is_active = true 
    LIMIT 1;
    
    -- Get current referee cost from cost_settings  
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
    
    -- Add field cost transaction for home team
    INSERT INTO team_transactions (
      team_id,
      transaction_type,
      amount,
      description,
      cost_setting_id,
      match_id,
      transaction_date
    ) VALUES (
      NEW.home_team_id,
      'match_cost',
      field_cost_amount,
      'Veldkosten voor wedstrijd ' || COALESCE(NEW.unique_number, 'M' || NEW.match_id::text),
      field_cost_setting.id,
      NEW.match_id,
      CURRENT_DATE
    );
    
    -- Add referee cost transaction for home team  
    INSERT INTO team_transactions (
      team_id,
      transaction_type,
      amount,
      description,
      cost_setting_id,
      match_id,
      transaction_date
    ) VALUES (
      NEW.home_team_id,
      'match_cost',
      referee_cost_amount,
      'Scheidsrechterkosten voor wedstrijd ' || COALESCE(NEW.unique_number, 'M' || NEW.match_id::text) || 
      CASE WHEN NEW.referee IS NOT NULL THEN ' (Scheidsrechter: ' || NEW.referee || ')' ELSE '' END,
      referee_cost_setting.id,
      NEW.match_id,
      CURRENT_DATE
    );
    
    -- Add field cost transaction for away team
    INSERT INTO team_transactions (
      team_id,
      transaction_type,
      amount,
      description,
      cost_setting_id,
      match_id,
      transaction_date
    ) VALUES (
      NEW.away_team_id,
      'match_cost',
      field_cost_amount,
      'Veldkosten voor wedstrijd ' || COALESCE(NEW.unique_number, 'M' || NEW.match_id::text),
      field_cost_setting.id,
      NEW.match_id,
      CURRENT_DATE
    );
    
    -- Add referee cost transaction for away team
    INSERT INTO team_transactions (
      team_id,
      transaction_type,
      amount,
      description,
      cost_setting_id,
      match_id,
      transaction_date
    ) VALUES (
      NEW.away_team_id,
      'match_cost',
      referee_cost_amount,
      'Scheidsrechterkosten voor wedstrijd ' || COALESCE(NEW.unique_number, 'M' || NEW.match_id::text) ||
      CASE WHEN NEW.referee IS NOT NULL THEN ' (Scheidsrechter: ' || NEW.referee || ')' ELSE '' END,
      referee_cost_setting.id,
      NEW.match_id,
      CURRENT_DATE
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically process match costs
DROP TRIGGER IF EXISTS trigger_process_match_costs ON matches;
CREATE TRIGGER trigger_process_match_costs
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION process_match_costs();

-- Update team balances to reflect new transactions
SELECT update_team_balances();