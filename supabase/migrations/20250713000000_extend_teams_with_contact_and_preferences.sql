-- Uitbreiding van teams tabel met contactgegevens en speelmoment-voorkeuren
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100),
  ADD COLUMN IF NOT EXISTS club_colors VARCHAR(100),
  ADD COLUMN IF NOT EXISTS preferred_play_moments JSONB;

COMMENT ON COLUMN public.teams.contact_person IS 'Naam van de contactpersoon voor het team';
COMMENT ON COLUMN public.teams.contact_phone IS 'Telefoonnummer van de contactpersoon';
COMMENT ON COLUMN public.teams.contact_email IS 'Emailadres van de contactpersoon';
COMMENT ON COLUMN public.teams.club_colors IS 'Clubkleuren (bv. rood-wit)';
COMMENT ON COLUMN public.teams.preferred_play_moments IS 'JSONB met voorkeursdagen, tijdsloten, locaties en extra wensen. Voorbeeld: {"days": ["maandag"], "timeslots": ["19:30-21:00"], "venues": [1], "notes": "Liever niet op maandag"}'; 