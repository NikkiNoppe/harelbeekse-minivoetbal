-- Harelbeke (organization_id = 1): actueel Sport Harelbeke-blauw palet in application_settings.
-- Vervangt legacy paars (#60368c) uit 20260309122159. Bron: DEFAULT_THEME in src/lib/colorUtils.ts / index.css.

DO $$
DECLARE
  v_theme jsonb := '{
    "primaryBase": "#0072b9",
    "primaryLight": "#4dbbff",
    "scale": {
      "50": "#f1f9fd",
      "100": "#e3f3fc",
      "200": "#c5e7fc",
      "300": "#8fd4ff",
      "400": "#4dbbff",
      "500": "#009dff",
      "600": "#0072b9",
      "700": "#005285",
      "800": "#003252",
      "900": "#02121c"
    },
    "destructive": { "base": "#ef4444", "bg": "#fee2e2", "border": "#f87171" },
    "success": { "base": "#22c55e", "bg": "#dcfce7" },
    "warning": { "base": "#ffb300", "bg": "#fff4d6" },
    "info": { "base": "#007fff", "bg": "#e3f3fc" }
  }'::jsonb;
BEGIN
  UPDATE public.application_settings
  SET
    organization_id = 1,
    setting_value = v_theme
  WHERE setting_category = 'theme_colors'
    AND setting_name = 'global_theme';

  IF NOT FOUND THEN
    INSERT INTO public.application_settings (
      organization_id,
      setting_category,
      setting_name,
      setting_value
    )
    VALUES (1, 'theme_colors', 'global_theme', v_theme);
  END IF;
END $$;

-- Branding-meta voor org 1: hostnames + themeColors als documentatie/fallback (useBranding → useThemeColors).
UPDATE public.organizations
SET branding_settings = branding_settings || jsonb_build_object(
  'displayName', 'Harelbeekse Minivoetbal Competitie',
  'shortName', 'Minivoetbal',
  'siteUrl', 'https://harelbekeminivoetbal.be',
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
  ),
  'themeColors', jsonb_build_object(
    'primaryBase', '#0072b9',
    'primaryLight', '#4dbbff',
    'scale', jsonb_build_object(
      '50', '#f1f9fd',
      '100', '#e3f3fc',
      '200', '#c5e7fc',
      '300', '#8fd4ff',
      '400', '#4dbbff',
      '500', '#009dff',
      '600', '#0072b9',
      '700', '#005285',
      '800', '#003252',
      '900', '#02121c'
    ),
    'destructive', jsonb_build_object('base', '#ef4444', 'bg', '#fee2e2', 'border', '#f87171'),
    'success', jsonb_build_object('base', '#22c55e', 'bg', '#dcfce7'),
    'warning', jsonb_build_object('base', '#ffb300', 'bg', '#fff4d6'),
    'info', jsonb_build_object('base', '#007fff', 'bg', '#e3f3fc')
  )
)
WHERE id = 1;
