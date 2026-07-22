-- Meerdere contact-e-mails per team (komma-gescheiden in contact_email)
ALTER TABLE public.teams
  ALTER COLUMN contact_email TYPE TEXT;

COMMENT ON COLUMN public.teams.contact_email IS 'E-mailadressen van de contactpersoon (komma-gescheiden)';
