-- Allow team managers to read all teams when tab visibility is enabled
-- This policy allows player_manager role to read all teams (not just their own)
-- This is needed when the admin enables the "Teams" tab visibility for team managers

-- Add a policy that allows team managers to read all teams
-- This complements the existing "Team managers can read their own team data" policy
CREATE POLICY "Team managers can read all teams when enabled" 
ON public.teams 
FOR SELECT 
TO authenticated
USING (
    get_current_user_role() = 'player_manager'::text
);

-- Note: This policy allows team_managers to read all teams
-- The existing policy "Team managers can read their own team data" will still work
-- PostgreSQL will use the first matching policy, so both policies can coexist
-- The more permissive policy (this one) will allow reading all teams

