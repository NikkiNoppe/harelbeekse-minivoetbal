-- Optimize deposits structure: one fixed "Storting" entry in costs, amounts in team_costs
-- This prevents costs table from growing with individual deposits

-- Step 1: Create a fixed "Storting" entry in costs table
-- Note: This will be handled by the next migration with proper unique constraint
INSERT INTO public.costs (name, description, amount, category, is_active)
VALUES ('Storting', 'Team storting', NULL, 'deposit', true);

-- Step 2: Update existing deposit transactions to use the fixed cost entry
UPDATE public.team_costs 
SET cost_setting_id = (
    SELECT id FROM public.costs 
    WHERE name = 'Storting' AND category = 'deposit'
    LIMIT 1
)
WHERE cost_setting_id IN (
    SELECT cs.id FROM public.costs cs 
    WHERE cs.category = 'deposit' AND cs.name != 'Storting'
);

-- Step 3: Clean up duplicate deposit entries in costs table
DELETE FROM public.costs 
WHERE category = 'deposit' 
AND name != 'Storting';

-- Step 4: Update the addTransaction function to use the fixed deposit entry
CREATE OR REPLACE FUNCTION public.add_team_transaction_with_amount(
    p_team_id INTEGER,
    p_cost_setting_id INTEGER,
    p_amount DECIMAL(10,2),
    p_transaction_date DATE DEFAULT CURRENT_DATE,
    p_match_id INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_team_cost_id INTEGER;
    v_cost_category TEXT;
BEGIN
    -- Get the cost category
    SELECT category INTO v_cost_category
    FROM public.costs
    WHERE id = p_cost_setting_id;
    
    -- For deposits, use the fixed "Storting" entry
    IF v_cost_category = 'deposit' THEN
        -- Get the fixed deposit cost entry
        SELECT id INTO p_cost_setting_id
        FROM public.costs
        WHERE name = 'Storting' AND category = 'deposit'
        LIMIT 1;
    END IF;
    
    -- Insert the team cost record
    INSERT INTO public.team_costs (
        team_id,
        cost_setting_id,
        amount,
        transaction_date,
        match_id
    ) VALUES (
        p_team_id,
        p_cost_setting_id,
        p_amount,
        p_transaction_date,
        p_match_id
    ) RETURNING id INTO v_team_cost_id;
    
    RETURN v_team_cost_id;
END;
$function$; 