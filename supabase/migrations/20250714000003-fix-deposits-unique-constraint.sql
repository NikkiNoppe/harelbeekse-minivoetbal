-- Fix unique constraint for costs table to support ON CONFLICT
-- Add unique constraint on name and category combination

-- Step 1: Add unique constraint to costs table
ALTER TABLE public.costs 
ADD CONSTRAINT costs_name_category_unique 
UNIQUE (name, category);

-- Step 2: Now we can safely insert the fixed "Storting" entry
INSERT INTO public.costs (name, description, amount, category, is_active)
VALUES ('Storting', 'Team storting', NULL, 'deposit', true)
ON CONFLICT (name, category) DO NOTHING;

-- Step 3: Update existing deposit transactions to use the fixed cost entry
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

-- Step 4: Clean up duplicate deposit entries in costs table
DELETE FROM public.costs 
WHERE category = 'deposit' 
AND name != 'Storting'; 