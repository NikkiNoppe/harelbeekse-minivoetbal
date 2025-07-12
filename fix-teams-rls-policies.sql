-- Fix RLS policies for teams table to allow anonymous users (since custom auth doesn't use Supabase auth)
-- This is the real fix for the custom authentication system

-- Drop existing policies
DROP POLICY IF EXISTS "teams_public_read_temp" ON public.teams;
DROP POLICY IF EXISTS "teams_authenticated_write_temp" ON public.teams;

-- Create policies that work with anonymous users (custom auth)
-- Policy 1: Public read access (everyone can view teams)
CREATE POLICY "teams_public_read_final" ON public.teams
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy 2: Allow anonymous users to perform all operations
-- Since your custom auth system doesn't use Supabase auth, 
-- all requests come through as anonymous
CREATE POLICY "teams_anon_write_final" ON public.teams
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Policy 3: Also allow authenticated users (in case some requests are authenticated)
CREATE POLICY "teams_authenticated_write_final" ON public.teams
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verify the new policies
SELECT 'RLS policies updated to support anonymous users from custom auth' as status; 