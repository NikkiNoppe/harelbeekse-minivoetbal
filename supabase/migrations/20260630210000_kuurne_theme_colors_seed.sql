-- Kuurne (organization_id = 2): thema op basis van minivoetbalkuurne.be
-- Donkere navigatie (#1A1A1A), geel accent (#FFC107), licht teal header-sfeer (info).
-- Fix: unique constraint per organization_id (was globaal category+name).

ALTER TABLE public.application_settings
  DROP CONSTRAINT IF EXISTS application_settings_setting_category_setting_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS application_settings_org_category_name_key
  ON public.application_settings (organization_id, setting_category, setting_name);

DO $$
DECLARE
  v_theme jsonb := '{
    "primaryBase": "#1A1A1A",
    "primaryLight": "#FFC107",
    "scale": {
      "50": "#fafafa",
      "100": "#f5f5f5",
      "200": "#FFF8E1",
      "300": "#FFE082",
      "400": "#FFD54F",
      "500": "#FFC107",
      "600": "#1A1A1A",
      "700": "#141414",
      "800": "#0f0f0f",
      "900": "#0a0a0a"
    },
    "destructive": { "base": "#ef4444", "bg": "#fee2e2", "border": "#f87171" },
    "success": { "base": "#22c55e", "bg": "#dcfce7" },
    "warning": { "base": "#FFC107", "bg": "#FFF8E1" },
    "info": { "base": "#5A8F99", "bg": "#E0EFF2" }
  }'::jsonb;
BEGIN
  INSERT INTO public.application_settings (
    organization_id,
    setting_category,
    setting_name,
    setting_value
  )
  VALUES (2, 'theme_colors', 'global_theme', v_theme)
  ON CONFLICT (organization_id, setting_category, setting_name)
  DO UPDATE SET setting_value = EXCLUDED.setting_value;
END $$;

UPDATE public.organizations
SET branding_settings = jsonb_build_object(
  'displayName', 'Minivoetbal Vereniging Kuurne',
  'shortName', 'Minivoetbal',
  'siteUrl', 'https://kuurneminivoetbal.nikkinoppe.be',
  'hostnames', jsonb_build_array('kuurneminivoetbal.nikkinoppe.be'),
  'logoPath', '/images/logos/minivoetbal-text.png',
  'logoIconPath', '/images/logos/minivoetbal-icon.png',
  'faviconPath', '/favicon.ico',
  'meta', jsonb_build_object(
    'defaultTitle', 'Kuurne Minivoetbal | Competitie, standen & uitslagen',
    'defaultDescription', 'Minivoetbalcompetitie Kuurne — standen, speelschema en uitslagen.'
  ),
  'themeColors', jsonb_build_object(
    'primaryBase', '#1A1A1A',
    'primaryLight', '#FFC107',
    'scale', jsonb_build_object(
      '50', '#fafafa',
      '100', '#f5f5f5',
      '200', '#FFF8E1',
      '300', '#FFE082',
      '400', '#FFD54F',
      '500', '#FFC107',
      '600', '#1A1A1A',
      '700', '#141414',
      '800', '#0f0f0f',
      '900', '#0a0a0a'
    ),
    'destructive', jsonb_build_object('base', '#ef4444', 'bg', '#fee2e2', 'border', '#f87171'),
    'success', jsonb_build_object('base', '#22c55e', 'bg', '#dcfce7'),
    'warning', jsonb_build_object('base', '#FFC107', 'bg', '#FFF8E1'),
    'info', jsonb_build_object('base', '#5A8F99', 'bg', '#E0EFF2')
  )
)
WHERE id = 2;
