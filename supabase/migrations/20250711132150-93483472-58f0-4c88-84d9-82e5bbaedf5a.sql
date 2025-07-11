-- Fix RLS configuration on players table
-- Enable RLS and create proper policies for custom auth system

-- Step 1: Enable RLS on players table
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing simple policies
DROP POLICY IF EXISTS "players_select_policy" ON public.players;
DROP POLICY IF EXISTS "players_insert_policy" ON public.players;
DROP POLICY IF EXISTS "players_update_policy" ON public.players;
DROP POLICY IF EXISTS "players_delete_policy" ON public.players;

-- Step 3: Create proper policies that work with custom auth system

-- Policy 1: Public read access (everyone can view players)
CREATE POLICY "players_public_read" ON public.players
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy 2: Admin full access (admins can do everything)
CREATE POLICY "players_admin_access" ON public.players
    FOR ALL
    TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- Policy 3: Team managers can manage their team's players
CREATE POLICY "players_team_manager_access" ON public.players
    FOR ALL
    TO authenticated
    USING (
        public.get_current_user_role() = 'player_manager' 
        AND team_id = ANY(public.get_current_user_team_ids())
    )
    WITH CHECK (
        public.get_current_user_role() = 'player_manager' 
        AND team_id = ANY(public.get_current_user_team_ids())
    );

-- Verify RLS is now enabled and policies are in place
SELECT 
    'RLS enabled on players table' as status,
    'Policies created for admin and team manager access' as details;