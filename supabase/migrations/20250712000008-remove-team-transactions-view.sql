-- Remove the redundant team_transactions view
-- This view is no longer needed since we use team_costs directly

-- Step 1: Drop the backward compatibility view
DROP VIEW IF EXISTS public.team_transactions CASCADE;

-- Step 2: Verify the cleanup
SELECT 
    'View removed' as status,
    'team_transactions view removed (redundant after optimization)' as details
UNION ALL
SELECT 
    'Direct usage' as status,
    'Use team_costs table directly with helper functions' as details
UNION ALL
SELECT 
    'Helper functions available' as status,
    'add_team_deposit() and add_team_cost() for easy usage' as details; 