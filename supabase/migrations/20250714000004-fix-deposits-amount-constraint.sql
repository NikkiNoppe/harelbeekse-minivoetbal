-- Fix amount constraint for costs table to allow NULL values for deposits
-- Allow NULL values in amount column for fixed cost entries

-- Step 1: Allow NULL values in the amount column
ALTER TABLE public.costs 
ALTER COLUMN amount DROP NOT NULL;

-- Step 2: Add unique constraint to costs table
ALTER TABLE public.costs 
ADD CONSTRAINT costs_name_category_unique 
UNIQUE (name, category);

-- Step 3: Now we can safely insert the fixed "Storting" entry with NULL amount
INSERT INTO public.costs (name, description, amount, category, is_active)
VALUES ('Storting', 'Team storting', NULL, 'deposit', true)
ON CONFLICT (name, category) DO NOTHING;

-- Step 4: Update existing deposit transactions to use the fixed cost entry
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

-- Step 5: Clean up duplicate deposit entries in costs table
DELETE FROM public.costs 
WHERE category = 'deposit' 
AND name != 'Storting'; 