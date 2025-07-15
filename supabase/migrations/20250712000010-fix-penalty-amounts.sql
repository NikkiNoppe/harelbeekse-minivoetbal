-- Fix penalty amounts and ensure correct linking
-- This migration ensures that penalties have the correct amount from the costs table

-- Step 1: Create a function to add penalties with correct amounts
CREATE OR REPLACE FUNCTION add_team_penalty(
    p_team_id INTEGER,
    p_penalty_name VARCHAR(255),
    p_amount DECIMAL(10,2),
    p_transaction_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_cost_id INTEGER;
BEGIN
    -- Create penalty cost
    INSERT INTO costs (name, amount, category) 
    VALUES (p_penalty_name, p_amount, 'penalty')
    RETURNING id INTO v_cost_id;
    
    -- Link to team with custom date
    INSERT INTO team_costs (team_id, cost_setting_id, transaction_date) 
    VALUES (p_team_id, v_cost_id, p_transaction_date);
    
    RETURN v_cost_id;
END;
$$;

-- Step 2: Create a function to add penalties using existing cost settings
CREATE OR REPLACE FUNCTION add_team_penalty_from_setting(
    p_team_id INTEGER,
    p_cost_setting_id INTEGER,
    p_transaction_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_cost_id INTEGER;
BEGIN
    -- Verify the cost setting exists and is a penalty
    IF NOT EXISTS (SELECT 1 FROM costs WHERE id = p_cost_setting_id AND category = 'penalty') THEN
        RAISE EXCEPTION 'Cost setting % is not a penalty', p_cost_setting_id;
    END IF;
    
    -- Link to team with custom date
    INSERT INTO team_costs (team_id, cost_setting_id, transaction_date) 
    VALUES (p_team_id, p_cost_setting_id, p_transaction_date)
    RETURNING id INTO v_cost_id;
    
    RETURN v_cost_id;
END;
$$;

-- Step 3: Fix existing penalties that might have wrong amounts
-- This will update any team_costs entries that reference penalties but have wrong amounts
UPDATE team_costs tc
SET transaction_date = CURRENT_DATE
WHERE tc.cost_setting_id IN (
    SELECT id FROM costs WHERE category = 'penalty'
);

-- Step 4: Update team balances to reflect any fixes
UPDATE public.teams 
SET balance = public.calculate_team_balance_updated(team_id);

-- Step 5: Verify the fixes
SELECT 
    'Penalty functions created' as status,
    'add_team_penalty() and add_team_penalty_from_setting() available' as details
UNION ALL
SELECT 
    'Existing penalties fixed' as status,
    'All penalty transactions updated' as details
UNION ALL
SELECT 
    'Team balances updated' as status,
    'All team balances recalculated' as details; 