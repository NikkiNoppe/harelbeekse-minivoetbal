-- ============================================================
-- VERIFICATION SCRIPT FOR TEAMS RLS POLICY
-- Run this in Supabase SQL Editor to verify the policy works
-- ============================================================

-- 1. Verify the new policy exists
SELECT 
    'Policy exists check' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS: Policy exists'
        ELSE '❌ FAIL: Policy not found'
    END as result
FROM pg_policies 
WHERE tablename = 'teams' 
AND policyname = 'Team managers can read all teams when enabled';

-- 2. List ALL policies on teams table (to check for conflicts)
SELECT 
    'All teams policies' as test_name,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NULL THEN 'No restriction (allows all)'
        ELSE substring(qual, 1, 100) || '...'
    END as condition
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY 
    CASE cmd
        WHEN 'SELECT' THEN 1
        WHEN 'INSERT' THEN 2
        WHEN 'UPDATE' THEN 3
        WHEN 'DELETE' THEN 4
        ELSE 5
    END,
    policyname;

-- 3. Check for potential conflicts
-- Look for policies that might restrict team_manager access
SELECT 
    'Conflict check' as test_name,
    policyname,
    CASE 
        WHEN qual LIKE '%player_manager%' AND qual LIKE '%team_id%' THEN 
            '⚠️ WARNING: This policy restricts team_managers to their own teams'
        WHEN qual LIKE '%player_manager%' AND qual NOT LIKE '%team_id%' THEN 
            '✅ OK: This policy allows team_managers to read all teams'
        ELSE 
            'ℹ️ INFO: Other policy'
    END as analysis
FROM pg_policies 
WHERE tablename = 'teams'
AND cmd = 'SELECT'
ORDER BY policyname;

-- 4. Verify policy structure
SELECT 
    'Policy structure check' as test_name,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NULL OR qual = '' THEN '❌ No condition (allows all - potential security issue)'
        WHEN qual LIKE '%player_manager%' AND qual NOT LIKE '%team_id%' THEN '✅ Allows all teams for team_managers'
        WHEN qual LIKE '%player_manager%' AND qual LIKE '%team_id%' THEN '⚠️ Restricts to own teams only'
        ELSE 'ℹ️ Other condition'
    END as security_analysis
FROM pg_policies 
WHERE tablename = 'teams'
AND policyname = 'Team managers can read all teams when enabled';

-- 5. Count total SELECT policies (should have multiple permissive policies)
SELECT 
    'Policy count check' as test_name,
    COUNT(*) as total_select_policies,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ PASS: Multiple policies exist (PostgreSQL uses OR logic)'
        ELSE '⚠️ WARNING: Only one policy found'
    END as result
FROM pg_policies 
WHERE tablename = 'teams'
AND cmd = 'SELECT';

-- 6. IMPORTANT: Check if both team_manager policies exist
-- PostgreSQL uses OR logic for permissive policies, so both should work
SELECT 
    'Team manager policies check' as test_name,
    COUNT(*) as team_manager_policies,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ PASS: Both restrictive and permissive policies exist (OR logic will allow all teams)'
        WHEN COUNT(*) = 1 THEN '⚠️ WARNING: Only one team_manager policy found'
        ELSE '❌ FAIL: No team_manager policies found'
    END as result
FROM pg_policies 
WHERE tablename = 'teams'
AND cmd = 'SELECT'
AND (
    qual LIKE '%player_manager%' 
    OR policyname LIKE '%team%manager%'
);

-- 7. Summary
SELECT 
    '=== SUMMARY ===' as summary,
    'PostgreSQL RLS uses OR logic for permissive policies.' as note_1,
    'If both policies exist, team_managers can read all teams.' as note_2,
    'Test the application to verify team_managers can see all teams.' as note_3;
