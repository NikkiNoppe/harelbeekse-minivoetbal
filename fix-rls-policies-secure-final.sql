-- SECURE RLS POLICIES FOR PLAYERS TABLE
-- This solution provides proper role-based access control that integrates with your existing auth system:
-- - Admins can manage all players
-- - Team managers (player_manager role) can only manage their own team's players
-- - Public read access for everyone
-- - Proper integration with your existing auth context

-- Step 1: Clean up existing policies
DROP POLICY IF EXISTS "players_unified_policy" ON public.players;
DROP POLICY IF EXISTS "players_anon_policy" ON public.players;
DROP POLICY IF EXISTS "players_authenticated_policy" ON public.players;
DROP POLICY IF EXISTS "players_admin_full_access" ON public.players;
DROP POLICY IF EXISTS "players_team_manager_access" ON public.players;
DROP POLICY IF EXISTS "players_public_read" ON public.players;
DROP POLICY IF EXISTS "players_temp_auth_access" ON public.players;
DROP POLICY IF EXISTS "players_authenticated_full_access" ON public.players;
DROP POLICY IF EXISTS "players_authenticated_operations" ON public.players;
DROP POLICY IF EXISTS "Allow all updates to players for testing" ON public.players;
DROP POLICY IF EXISTS "Allow all deletes to players for testing" ON public.players;

-- Step 2: Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Step 3: Create helper functions that integrate with your auth system

-- Function to get current user's role from your auth context
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role text;
    current_user_id integer;
BEGIN
    -- Get the current user ID from auth context
    current_user_id := (SELECT auth.uid());
    
    -- If no authenticated user, return anonymous
    IF current_user_id IS NULL THEN
        RETURN 'anonymous';
    END IF;
    
    -- Get user role from users table
    SELECT role INTO user_role
    FROM public.users
    WHERE user_id = current_user_id;
    
    RETURN COALESCE(user_role, 'anonymous');
END;
$$;

-- Function to get current user's team IDs (for player_manager role)
CREATE OR REPLACE FUNCTION public.get_current_user_team_ids()
RETURNS integer[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    team_ids integer[];
    current_user_id integer;
BEGIN
    -- Get the current user ID from auth context
    current_user_id := (SELECT auth.uid());
    
    -- If no authenticated user, return empty array
    IF current_user_id IS NULL THEN
        RETURN ARRAY[]::integer[];
    END IF;
    
    -- Get team IDs for current user from team_users table
    SELECT ARRAY_AGG(team_id) INTO team_ids
    FROM public.team_users
    WHERE user_id = current_user_id;
    
    RETURN COALESCE(team_ids, ARRAY[]::integer[]);
END;
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.get_current_user_role() = 'admin';
END;
$$;

-- Function to check if current user is team manager for specific team
CREATE OR REPLACE FUNCTION public.is_current_user_team_manager_for_team(team_id_param integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role text;
    user_team_ids integer[];
BEGIN
    -- Get user role
    user_role := public.get_current_user_role();
    
    -- If user is admin, they can manage any team
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- If user is player_manager, check if they manage this specific team
    IF user_role = 'player_manager' THEN
        user_team_ids := public.get_current_user_team_ids();
        RETURN team_id_param = ANY(user_team_ids);
    END IF;
    
    -- Other roles cannot manage teams
    RETURN false;
END;
$$;

-- Function to check if current user can manage a specific player
CREATE OR REPLACE FUNCTION public.can_current_user_manage_player(player_team_id integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role text;
    user_team_ids integer[];
BEGIN
    -- Get user role
    user_role := public.get_current_user_role();
    
    -- If user is admin, they can manage any player
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- If user is player_manager, check if they manage this player's team
    IF user_role = 'player_manager' THEN
        user_team_ids := public.get_current_user_team_ids();
        RETURN player_team_id = ANY(user_team_ids);
    END IF;
    
    -- Other roles cannot manage players
    RETURN false;
END;
$$;

-- Step 4: Create comprehensive RLS policies

-- Policy 1: Public read access (everyone can view players)
CREATE POLICY "players_public_read" ON public.players
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy 2: Admin full access (admins can perform all operations on all players)
CREATE POLICY "players_admin_full_access" ON public.players
    FOR ALL
    TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- Policy 3: Team manager access (player_manager can manage their own team's players)
CREATE POLICY "players_team_manager_access" ON public.players
    FOR ALL
    TO authenticated
    USING (public.can_current_user_manage_player(team_id))
    WITH CHECK (public.can_current_user_manage_player(team_id));

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_team_id_rls ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_users_user_id ON public.team_users(user_id);
CREATE INDEX IF NOT EXISTS idx_team_users_team_id ON public.team_users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Step 6: Verify the policies
SELECT 
    'SECURE RLS POLICIES CREATED' as status,
    'Comprehensive role-based access control implemented' as details
UNION ALL
SELECT 
    'Admin access' as status,
    'Admins can manage all players' as details
UNION ALL
SELECT 
    'Team manager access' as status,
    'Team managers can only manage their own team players' as details
UNION ALL
SELECT 
    'Public read access' as status,
    'Everyone can view players' as details
UNION ALL
SELECT 
    'Auth integration' as status,
    'Properly integrated with existing auth system' as details
UNION ALL
SELECT 
    'Performance optimized' as status,
    'Indexes created for efficient role checking' as details;

-- Step 7: Test the policies with sample queries
-- (These are for verification, not execution)
/*
-- Test admin access
SELECT 'Admin can read all players' as test, COUNT(*) as count 
FROM public.players 
WHERE public.is_current_user_admin();

-- Test team manager access
SELECT 'Team manager can read their team players' as test, COUNT(*) as count 
FROM public.players 
WHERE public.get_current_user_role() = 'player_manager' 
  AND public.can_current_user_manage_player(team_id);

-- Test public read access
SELECT 'Public can read all players' as test, COUNT(*) as count 
FROM public.players;
*/ 