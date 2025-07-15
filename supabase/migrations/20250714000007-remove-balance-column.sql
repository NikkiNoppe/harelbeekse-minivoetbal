-- Remove balance column from teams table since we calculate balances real-time
-- All balance calculations are now done from team_costs table

-- Step 1: Remove the balance column from teams table
ALTER TABLE public.teams 
DROP COLUMN IF EXISTS balance;

-- Step 2: Remove triggers that update the balance column
DROP TRIGGER IF EXISTS trigger_update_team_balance_on_cost ON public.team_costs;
DROP TRIGGER IF EXISTS trigger_update_team_balance_on_transaction ON public.team_costs;
DROP TRIGGER IF EXISTS team_transactions_balance_update ON public.team_transactions;

-- Step 3: Remove the trigger function that updates team balances
DROP FUNCTION IF EXISTS public.trigger_update_team_balance() CASCADE;

-- Step 4: Remove the update_team_balances function
DROP FUNCTION IF EXISTS public.update_team_balances() CASCADE;

-- Step 5: Keep the calculate_team_balance_updated function for real-time calculations
-- This function is still useful for calculating balances on-demand
CREATE OR REPLACE FUNCTION public.calculate_team_balance_updated(team_id_param INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  balance DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN cs.category = 'deposit' THEN COALESCE(tc.amount, cs.amount)  -- Deposits add to balance
      WHEN cs.category IN ('match_cost', 'penalty', 'other', 'field_cost', 'referee_cost') THEN -COALESCE(tc.amount, cs.amount)  -- All costs subtract from balance
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

-- Step 6: Update the team_financial_overview view to use real-time calculation
CREATE OR REPLACE VIEW public.team_financial_overview AS
SELECT 
  t.team_id,
  t.team_name,
  fb.start_capital,
  fb.field_costs,
  fb.referee_costs,
  fb.penalties,
  fb.other_costs,
  fb.adjustments,
  fb.current_balance,
  public.calculate_team_balance_updated(t.team_id) as calculated_balance
FROM public.teams t
CROSS JOIN LATERAL public.get_team_financial_breakdown(t.team_id) fb
ORDER BY t.team_name; 