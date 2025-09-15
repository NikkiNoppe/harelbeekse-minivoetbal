-- Drop the unnecessary teams_public view
DROP VIEW IF EXISTS public.teams_public;

-- Drop the existing broad public policy
DROP POLICY IF EXISTS "Public can read team names only" ON public.teams;

-- Create a new policy that allows public access (application will control column access)
CREATE POLICY "Public can read basic team info"
ON public.teams
FOR SELECT
TO public
USING (true);

-- Keep existing policies for authenticated users
-- (The existing admin and team manager policies already provide proper authenticated access)