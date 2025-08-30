-- Fix RLS policy for team_users so Team Managers can access their own team_id
-- This allows fetchTeamIdForUser to work properly for Team Managers during login

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Team managers can read their own team relations" ON public.team_users;

-- Create new policy to allow Team Managers to read their own team_id
CREATE POLICY "Team managers can read their own team relations" 
ON public.team_users 
FOR SELECT 
TO authenticated
USING (
  -- Admins can see all
  get_current_user_role() = 'admin' OR
  -- Team managers can only see their own records (but we need to compare with actual user_id)
  (get_current_user_role() = 'player_manager' AND user_id = current_setting('app.current_user_id', true)::integer)
);

-- We also need a way to set the current user_id context during login
-- Create a function to set the user_id in session context
CREATE OR REPLACE FUNCTION public.set_current_user_context(p_user_id integer, p_role text, p_team_ids text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Set user role
  PERFORM set_config('app.current_user_role', p_role, false);
  
  -- Set user ID for team_users access
  PERFORM set_config('app.current_user_id', p_user_id::text, false);
  
  -- Set team IDs if provided
  IF p_team_ids != '' THEN
    PERFORM set_config('app.current_user_team_ids', p_team_ids, false);
  END IF;
END;
$$;