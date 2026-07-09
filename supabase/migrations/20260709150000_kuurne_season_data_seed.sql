-- Kuurne (org 2): seizoensconfiguratie op basis van Harelbeke, met lege sportzalen.

INSERT INTO public.application_settings (
  organization_id,
  setting_category,
  setting_name,
  setting_value
)
SELECT
  2,
  src.setting_category,
  src.setting_name,
  jsonb_set(src.setting_value, '{venues}', '[]'::jsonb, true)
FROM public.application_settings src
WHERE src.organization_id = 1
  AND src.setting_category = 'season_data'
  AND src.setting_name = 'main_config'
ON CONFLICT (organization_id, setting_category, setting_name)
DO UPDATE SET setting_value = EXCLUDED.setting_value;
