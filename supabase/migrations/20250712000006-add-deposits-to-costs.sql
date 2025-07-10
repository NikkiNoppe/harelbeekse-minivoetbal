-- Extend costs table to support both deposits and costs/penalties
-- This allows for positive amounts (deposits) and negative amounts (costs/penalties)

-- Step 1: Add new category for deposits
ALTER TABLE public.costs 
DROP CONSTRAINT IF EXISTS cost_settings_category_check;

ALTER TABLE public.costs 
ADD CONSTRAINT cost_settings_category_check 
CHECK (category IN ('match_cost', 'penalty', 'other', 'deposit'));

-- Step 2: Update the balance calculation function to handle deposits
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

-- Step 3: Create helper functions for easy deposit and cost management
CREATE OR REPLACE FUNCTION add_team_deposit(
    p_team_id INTEGER,
    p_deposit_name VARCHAR(255),
    p_amount DECIMAL(10,2)
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_cost_id INTEGER;
BEGIN
    -- Create deposit cost
    INSERT INTO costs (name, amount, category) 
    VALUES (p_deposit_name, p_amount, 'deposit')
    RETURNING id INTO v_cost_id;
    
    -- Link to team
    INSERT INTO team_costs (team_id, cost_setting_id, transaction_date) 
    VALUES (p_team_id, v_cost_id, CURRENT_DATE);
    
    RETURN v_cost_id;
END;
$$;

CREATE OR REPLACE FUNCTION add_team_cost(
    p_team_id INTEGER,
    p_cost_name VARCHAR(255),
    p_amount DECIMAL(10,2),
    p_category VARCHAR(50) DEFAULT 'other',
    p_match_id INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_cost_id INTEGER;
BEGIN
    -- Validate category
    IF p_category NOT IN ('match_cost', 'penalty', 'other') THEN
        RAISE EXCEPTION 'Invalid category: %. Must be one of: match_cost, penalty, other', p_category;
    END IF;
    
    -- Create cost
    INSERT INTO costs (name, amount, category) 
    VALUES (p_cost_name, p_amount, p_category)
    RETURNING id INTO v_cost_id;
    
    -- Link to team
    INSERT INTO team_costs (team_id, cost_setting_id, match_id, transaction_date) 
    VALUES (p_team_id, v_cost_id, p_match_id, CURRENT_DATE);
    
    RETURN v_cost_id;
END;
$$;

-- Step 4: Update the backward compatibility view to show deposits correctly
CREATE OR REPLACE VIEW public.team_transactions AS
SELECT 
  tc.id,
  tc.team_id,
  t.team_name,
  cs.name as cost_name,
  cs.amount,
  cs.category as transaction_type,
  tc.match_id,
  tc.transaction_date,
  tc.cost_setting_id,
  CASE 
    WHEN cs.category = 'deposit' THEN cs.amount
    ELSE -cs.amount
  END as balance_impact
FROM public.team_costs tc
LEFT JOIN public.teams t ON tc.team_id = t.team_id
LEFT JOIN public.costs cs ON tc.cost_setting_id = cs.id;

-- Step 5: Add some example deposits and costs for testing
-- (You can remove these if you don't want example data)
INSERT INTO costs (name, amount, category) VALUES 
('Storting team A', 600.00, 'deposit'),
('Storting team B', 500.00, 'deposit'),
('Veldhuur wedstrijd', 25.00, 'match_cost'),
('Te laat komen', 10.00, 'penalty')
ON CONFLICT (name) DO NOTHING;

-- Step 6: Verify the changes
SELECT 
    'Deposits added' as status,
    'New category "deposit" added to costs table' as details
UNION ALL
SELECT 
    'Balance calculation updated' as status,
    'Deposits add to balance, costs subtract from balance' as details
UNION ALL
SELECT 
    'Helper functions created' as status,
    'add_team_deposit() and add_team_cost() functions available' as details
UNION ALL
SELECT 
    'View updated' as status,
    'team_transactions view now shows balance_impact column' as details; 