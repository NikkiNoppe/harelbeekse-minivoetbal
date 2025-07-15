-- Add individual amount support to team_costs table
-- This allows transactions to have individual amounts even when referencing a cost_setting_id

-- Step 1: Add amount column to team_costs table
ALTER TABLE public.team_costs 
ADD COLUMN amount DECIMAL(10,2);

-- Step 2: Update existing records to have amounts from their cost settings
UPDATE public.team_costs 
SET amount = cs.amount
FROM public.costs cs
WHERE team_costs.cost_setting_id = cs.id 
AND team_costs.amount IS NULL;

-- Step 3: Update the balance calculation function to use individual amounts when available
CREATE OR REPLACE FUNCTION public.calculate_team_balance_updated(team_id_param INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  balance DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN cs.category = 'deposit' THEN COALESCE(tc.amount, cs.amount)  -- Use individual amount or default
      WHEN cs.category IN ('match_cost', 'penalty', 'other') THEN -COALESCE(tc.amount, cs.amount)  -- Use individual amount or default
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

-- Step 4: Create a function to add transactions with individual amounts
CREATE OR REPLACE FUNCTION add_team_transaction_with_amount(
    p_team_id INTEGER,
    p_cost_setting_id INTEGER,
    p_amount DECIMAL(10,2) DEFAULT NULL,
    p_transaction_date DATE DEFAULT CURRENT_DATE,
    p_match_id INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_cost_amount DECIMAL(10,2);
    v_final_amount DECIMAL(10,2);
    v_team_cost_id INTEGER;
BEGIN
    -- Get the default amount from the cost setting
    SELECT amount INTO v_cost_amount
    FROM costs
    WHERE id = p_cost_setting_id AND is_active = true;
    
    -- Use provided amount or default to cost setting amount
    v_final_amount := COALESCE(p_amount, v_cost_amount);
    
    -- Insert the team cost with individual amount
    INSERT INTO team_costs (team_id, cost_setting_id, amount, transaction_date, match_id) 
    VALUES (p_team_id, p_cost_setting_id, v_final_amount, p_transaction_date, p_match_id)
    RETURNING id INTO v_team_cost_id;
    
    RETURN v_team_cost_id;
END;
$$;

-- Step 5: Update the backward compatibility view to show individual amounts
CREATE OR REPLACE VIEW public.team_transactions AS
SELECT 
  tc.id,
  tc.team_id,
  t.team_name,
  cs.name as cost_name,
  COALESCE(tc.amount, cs.amount) as amount,  -- Use individual amount if available
  cs.category as transaction_type,
  tc.match_id,
  tc.transaction_date,
  tc.cost_setting_id,
  CASE 
    WHEN cs.category = 'deposit' THEN COALESCE(tc.amount, cs.amount)
    ELSE -COALESCE(tc.amount, cs.amount)
  END as balance_impact
FROM public.team_costs tc
LEFT JOIN public.teams t ON tc.team_id = t.team_id
LEFT JOIN public.costs cs ON tc.cost_setting_id = cs.id;

-- Step 6: Update all team balances to use the new calculation
UPDATE public.teams 
SET balance = public.calculate_team_balance_updated(team_id);

-- Step 7: Add comment to clarify the purpose of the amount column
COMMENT ON COLUMN public.team_costs.amount IS 'Individual transaction amount. If NULL, uses the amount from the referenced cost setting.'; 