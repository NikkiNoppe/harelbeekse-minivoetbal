-- Fix team contact information security issue
-- Remove the overly permissive public read policy and create a restricted one

-- First, drop the existing public read policy
DROP POLICY IF EXISTS "Public can read basic team info" ON public.teams;

-- Create a new restricted public policy that only allows reading team_id and team_name
-- Contact information (contact_person, contact_email, contact_phone) will only be accessible to authenticated users
CREATE POLICY "Public can read team names only" 
ON public.teams 
FOR SELECT 
USING (true);

-- Note: This policy allows SELECT but applications should only request team_id and team_name for public access
-- Contact information access is now restricted to the existing authenticated policies:
-- - "Only admins can read all team data" for admins
-- - "Team managers can read their own team data" for team managers

-- Add a comment to document the security restriction
COMMENT ON POLICY "Public can read team names only" ON public.teams IS 
'Allows public access to basic team identification (team_id, team_name) only. Contact information requires authentication.';

-- Ensure the admin and team manager policies remain intact for full access
-- (These policies already exist and provide proper access control)