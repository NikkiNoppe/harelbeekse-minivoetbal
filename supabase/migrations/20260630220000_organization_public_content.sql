-- Publieke paginateksten in branding_settings.content (override via DB).

UPDATE public.organizations
SET branding_settings = branding_settings || jsonb_build_object(
  'content', jsonb_build_object(
    'algemeen', jsonb_build_object(
      'title', 'Minivoetbal Harelbeke',
      'subtitle', 'De officiële minivoetbalcompetitie van Harelbeke en Bavikhove sinds 1979',
      'aboutParagraph', 'Opgericht in 1979 is de Harelbeekse Minivoetbal Competitie uitgegroeid tot de grootste minivoetbalcompetitie van Harelbeke. Elk seizoen nemen tal van teams uit Harelbeke en omgeving deel.'
    ),
    'footerTagline', 'Minivoetbalcompetitie sinds 1979.'
  )
)
WHERE id = 1;

UPDATE public.organizations
SET branding_settings = branding_settings || jsonb_build_object(
  'content', jsonb_build_object(
    'algemeen', jsonb_build_object(
      'title', 'Minivoetbal Vereniging Kuurne',
      'subtitle', 'Standen, speelschema en uitslagen in Kuurne',
      'aboutParagraph', 'Welkom bij de minivoetbalcompetitie van Kuurne. Op deze site vind je het actuele speelschema, klassementen, uitslagen en alle praktische info over het lopende seizoen.'
    ),
    'footerTagline', 'Minivoetbalcompetitie in Kuurne.'
  )
)
WHERE id = 2;
