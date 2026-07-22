-- Kuurne: tijdelijke From/Reply-To via geverifieerd Harelbeke-domein (Resend).
-- Later vervangen door ...@mvvkuurne.be zodra dat domein geverifieerd is.

UPDATE public.organizations
SET branding_settings = jsonb_set(
  jsonb_set(
    COALESCE(branding_settings, '{}'::jsonb),
    '{email,fromEmail}',
    '"info@harelbekeminivoetbal.be"'::jsonb,
    true
  ),
  '{email,replyToEmail}',
  '"info@harelbekeminivoetbal.be"'::jsonb,
  true
)
WHERE slug = 'kuurne';
