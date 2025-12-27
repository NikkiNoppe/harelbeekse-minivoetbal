-- Create SECURITY DEFINER function to get team IDs for a user
-- This bypasses RLS so it can be called before context is fully set
CREATE OR REPLACE FUNCTION public.get_user_team_ids_secure(p_user_id integer)
RETURNS integer[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ARRAY_AGG(team_id), ARRAY[]::integer[])
  FROM team_users 
  WHERE user_id = p_user_id
$$;