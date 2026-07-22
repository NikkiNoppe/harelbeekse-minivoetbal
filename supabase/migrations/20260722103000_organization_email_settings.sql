-- Per-tenant e-mailinstellingen in branding_settings.email (afzender + reply-to).
-- Harelbeke default: info@harelbekeminivoetbal.be

UPDATE public.organizations
SET branding_settings = branding_settings || jsonb_build_object(
  'email', jsonb_build_object(
    'fromEmail', 'info@harelbekeminivoetbal.be',
    'replyToEmail', 'info@harelbekeminivoetbal.be'
  )
)
WHERE id = 1
  AND (
    branding_settings->'email' IS NULL
    OR branding_settings->'email' = 'null'::jsonb
    OR COALESCE(branding_settings->'email'->>'fromEmail', '') = ''
  );

-- Kuurne: afleiden uit siteUrl indien nog leeg
UPDATE public.organizations
SET branding_settings = branding_settings || jsonb_build_object(
  'email', jsonb_build_object(
    'fromEmail', 'info@kuurneminivoetbal.nikkinoppe.be',
    'replyToEmail', 'info@kuurneminivoetbal.nikkinoppe.be'
  )
)
WHERE id = 2
  AND (
    branding_settings->'email' IS NULL
    OR branding_settings->'email' = 'null'::jsonb
    OR COALESCE(branding_settings->'email'->>'fromEmail', '') = ''
  );

COMMENT ON COLUMN public.organizations.branding_settings IS
  'JSONB: logo-paden, theme-kleuren, sitenaam, contact, email (fromEmail/replyToEmail), enz.';
