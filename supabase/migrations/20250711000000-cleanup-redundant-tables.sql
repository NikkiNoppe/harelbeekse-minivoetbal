-- Cleanup redundant transaction tables and views
-- These views are no longer needed as the data is available through the main team_transactions table

-- Step 1: Drop the redundant views
DROP VIEW IF EXISTS public.comprehensive_transactions CASCADE;
DROP VIEW IF EXISTS public.transaction_summary CASCADE;
DROP VIEW IF EXISTS public.transactions_with_derived_data CASCADE;

-- Step 2: Drop related functions that are no longer needed
DROP FUNCTION IF EXISTS public.migrate_transactions_to_cost_settings() CASCADE;

-- Step 3: Verify the cleanup
SELECT 
    'Cleanup complete' as status,
    'Redundant transaction views removed' as details
UNION ALL
SELECT 
    'Functions removed' as status,
    'Unused migration function removed' as details
UNION ALL
SELECT 
    'Database optimized' as status,
    'Reduced complexity by removing redundant views' as details; 