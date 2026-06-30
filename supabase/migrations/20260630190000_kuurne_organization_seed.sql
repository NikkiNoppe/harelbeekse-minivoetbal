-- Kuurne als tweede organisatie (structuur + branding, geen live competitiedata).

INSERT INTO public.organizations (id, name, slug, branding_settings)
VALUES (
  2,
  'Kuurne Minivoetbal',
  'kuurne',
  jsonb_build_object(
    'displayName', 'Kuurne Minivoetbal',
    'shortName', 'Minivoetbal',
    'siteUrl', 'https://kuurneminivoetbal.nikkinoppe.be',
    'hostnames', jsonb_build_array('kuurneminivoetbal.nikkinoppe.be'),
    'logoPath', '/images/logos/minivoetbal-text.png',
    'logoIconPath', '/images/logos/minivoetbal-icon.png',
    'faviconPath', '/favicon.ico',
    'meta', jsonb_build_object(
      'defaultTitle', 'Kuurne Minivoetbal | Competitie, standen & uitslagen',
      'defaultDescription', 'Minivoetbalcompetitie Kuurne — standen, speelschema en uitslagen.'
    )
  )
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  branding_settings = EXCLUDED.branding_settings;

-- Harelbeke branding_settings uitbreiden (backward compatible uiterlijk)
UPDATE public.organizations
SET branding_settings = branding_settings || jsonb_build_object(
  'hostnames', jsonb_build_array(
    'harelbekeminivoetbal.nikkinoppe.be',
    'harelbekeminivoetbal.be',
    'www.harelbekeminivoetbal.be'
  ),
  'logoPath', '/images/logos/minivoetbal-text.png',
  'logoIconPath', '/images/logos/minivoetbal-icon.png',
  'faviconPath', '/favicon.ico',
  'meta', jsonb_build_object(
    'defaultTitle', 'Minivoetbal Harelbeke | Competitie, standen & uitslagen',
    'defaultDescription', 'Nieuws en info over de Harelbeekse Minivoetbal Competitie.'
  )
)
WHERE id = 1;
