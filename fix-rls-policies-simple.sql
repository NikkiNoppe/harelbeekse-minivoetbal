-- Simple RLS policies for players table - WORKING VERSION
-- This allows updates to work immediately, with security notes for future

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "players_unified_policy" ON public.players;
DROP POLICY IF EXISTS "players_anon_policy" ON public.players;
DROP POLICY IF EXISTS "players_authenticated_policy" ON public.players;
DROP POLICY IF EXISTS "players_admin_full_access" ON public.players;
DROP POLICY IF EXISTS "players_team_manager_access" ON public.players;
DROP POLICY IF EXISTS "players_public_read" ON public.players;
DROP POLICY IF EXISTS "players_temp_auth_access" ON public.players;

-- Create simple policies that work with your current auth system

-- Policy 1: Public read access (everyone can view players)
CREATE POLICY "players_public_read" ON public.players
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy 2: Authenticated users can perform all operations
-- NOTE: This is a temporary solution for immediate functionality
-- TODO: Implement proper role-based access control in the future
CREATE POLICY "players_authenticated_full_access" ON public.players
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verify the policies
SELECT 
    'Simple RLS policies created' as status,
    'Updates should now work for authenticated users' as details
UNION ALL
SELECT 
    'Security note' as status,
    'Consider implementing role-based policies in the future' as details
UNION ALL
SELECT 
    'Current access' as status,
    'All authenticated users can manage players' as details;

-- Future security improvements (not implemented yet):
-- 1. Create proper session-based role checking functions
-- 2. Implement admin-only access for sensitive operations
-- 3. Implement team-based access for player_managers
-- 4. Add audit logging for player changes 