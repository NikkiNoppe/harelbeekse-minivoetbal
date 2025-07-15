-- Fix deposit calculation to ensure deposits are properly calculated
-- Update the balance calculation function to handle deposits correctly

-- Step 1: Update the balance calculation function to handle deposits correctly
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

-- Step 2: Update all team balances to use the new calculation
UPDATE public.teams 
SET balance = public.calculate_team_balance_updated(team_id);

-- Step 3: Create a function to get detailed financial breakdown for a team
CREATE OR REPLACE FUNCTION public.get_team_financial_details(team_id_param INTEGER)
RETURNS TABLE (
  start_capital DECIMAL(10,2),
  field_costs DECIMAL(10,2),
  referee_costs DECIMAL(10,2),
  penalties DECIMAL(10,2),
  other_costs DECIMAL(10,2),
  adjustments DECIMAL(10,2),
  current_balance DECIMAL(10,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH team_transactions AS (
    SELECT 
      COALESCE(tc.amount, cs.amount) as transaction_amount,
      cs.category,
      cs.name,
      tc.transaction_date
    FROM public.team_costs tc
    LEFT JOIN public.costs cs ON tc.cost_setting_id = cs.id
    WHERE tc.team_id = team_id_param
  )
  SELECT 
    -- Startkapitaal: alle deposits
    COALESCE(SUM(CASE WHEN category = 'deposit' THEN transaction_amount ELSE 0 END), 0) as start_capital,
    
    -- Veldkosten: alle match_cost met 'veld' in de naam
    COALESCE(SUM(CASE 
      WHEN category = 'match_cost' AND (name ILIKE '%veld%' OR name ILIKE '%field%') 
      THEN transaction_amount 
      ELSE 0 
    END), 0) as field_costs,
    
    -- Scheidsrechterkosten: alle match_cost met 'scheids' in de naam
    COALESCE(SUM(CASE 
      WHEN category = 'match_cost' AND (name ILIKE '%scheids%' OR name ILIKE '%referee%') 
      THEN transaction_amount 
      ELSE 0 
    END), 0) as referee_costs,
    
    -- Boetes: alle penalty transacties
    COALESCE(SUM(CASE WHEN category = 'penalty' THEN transaction_amount ELSE 0 END), 0) as penalties,
    
    -- Andere kosten: alle andere match_cost en other
    COALESCE(SUM(CASE 
      WHEN category IN ('match_cost', 'other') 
      AND name NOT ILIKE '%veld%' 
      AND name NOT ILIKE '%field%'
      AND name NOT ILIKE '%scheids%' 
      AND name NOT ILIKE '%referee%'
      THEN transaction_amount 
      ELSE 0 
    END), 0) as other_costs,
    
    -- Correcties: alle adjustment transacties (positief of negatief)
    COALESCE(SUM(CASE WHEN category = 'other' AND name ILIKE '%correctie%' THEN transaction_amount ELSE 0 END), 0) as adjustments,
    
    -- Huidig saldo: startkapitaal - alle kosten + correcties
    COALESCE(SUM(
      CASE 
        WHEN category = 'deposit' THEN transaction_amount
        WHEN category IN ('match_cost', 'penalty', 'other', 'field_cost', 'referee_cost') THEN -transaction_amount
        ELSE 0
      END
    ), 0) as current_balance
  FROM team_transactions;
END;
$$; 