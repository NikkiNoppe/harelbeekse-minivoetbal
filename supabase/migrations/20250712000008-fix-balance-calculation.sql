-- Fix balance calculation for new team_costs structure
-- Update the balance calculation function to work with the new structure

CREATE OR REPLACE FUNCTION public.calculate_team_balance_updated(team_id_param INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  balance DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN cs.category = 'deposit' THEN cs.amount  -- Deposits add to balance
      WHEN cs.category IN ('match_cost', 'penalty', 'other') THEN -cs.amount  -- Costs subtract from balance
      ELSE 0
    END
  ), 0)
  INTO balance
  FROM public.team_costs tc
  LEFT JOIN public.costs cs ON tc.cost_setting_id = cs.id
  WHERE tc.team_id = team_id_param;
  
  RETURN balance;
END;
$$;

-- Update all team balances to use the new calculation
UPDATE public.teams 
SET balance = public.calculate_team_balance_updated(team_id);

-- Update the trigger function to use the new calculation
CREATE OR REPLACE FUNCTION public.trigger_update_team_balance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Update balance voor het oude team
    UPDATE teams 
    SET balance = calculate_team_balance_updated(OLD.team_id)
    WHERE team_id = OLD.team_id;
    RETURN OLD;
  ELSE
    -- Update balance voor het nieuwe team
    UPDATE teams 
    SET balance = calculate_team_balance_updated(NEW.team_id)
    WHERE team_id = NEW.team_id;
    
    -- Als team_id is gewijzigd, update ook het oude team
    IF TG_OP = 'UPDATE' AND OLD.team_id IS DISTINCT FROM NEW.team_id THEN
      UPDATE teams 
      SET balance = calculate_team_balance_updated(OLD.team_id)
      WHERE team_id = OLD.team_id;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$; 