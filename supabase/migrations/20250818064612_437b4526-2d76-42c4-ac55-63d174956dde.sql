-- Allow public access to read basic team information including contact details
CREATE POLICY "Public can read basic team info"
ON public.teams
FOR SELECT
USING (true);

-- Update the teams_public view to include contact information and club colors
DROP VIEW IF EXISTS public.teams_public;

CREATE VIEW public.teams_public AS
SELECT 
  team_id,
  team_name,
  contact_person,
  contact_phone, 
  contact_email,
  club_colors
FROM public.teams
ORDER BY team_name;