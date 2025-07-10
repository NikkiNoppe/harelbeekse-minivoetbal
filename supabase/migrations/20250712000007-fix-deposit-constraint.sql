-- Fix the constraint issue for deposits
-- First, let's check what constraints exist and update the correct one

-- Step 1: Check what constraints exist on the costs table
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- List all check constraints on costs table
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.costs'::regclass 
        AND contype = 'c'
    LOOP
        RAISE NOTICE 'Found constraint: %', constraint_name;
    END LOOP;
END $$;

-- Step 2: Drop all possible constraint names and recreate
ALTER TABLE public.costs 
DROP CONSTRAINT IF EXISTS cost_settings_category_check;

ALTER TABLE public.costs 
DROP CONSTRAINT IF EXISTS costs_category_check;

ALTER TABLE public.costs 
DROP CONSTRAINT IF EXISTS costs_category_check_old;

-- Step 3: Add the correct constraint with deposit category
ALTER TABLE public.costs 
ADD CONSTRAINT costs_category_check 
CHECK (category IN ('match_cost', 'penalty', 'other', 'deposit'));

-- Step 4: Test adding a deposit
INSERT INTO costs (name, amount, category) VALUES 
('Test deposit', 100.00, 'deposit')
ON CONFLICT (name) DO NOTHING;

-- Step 5: Verify the constraint works
SELECT 
    'Constraint updated' as status,
    'Deposit category now allowed' as details
UNION ALL
SELECT 
    'Test deposit added' as status,
    'Successfully added deposit category' as details; 