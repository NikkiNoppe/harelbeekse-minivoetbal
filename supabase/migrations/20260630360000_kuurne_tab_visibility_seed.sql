-- Kuurne (org 2): tab_visibility-instellingen gelijk aan Harelbeke (org 1).

ALTER TABLE public.application_settings
  DROP CONSTRAINT IF EXISTS application_settings_setting_category_setting_name_key;

DROP INDEX IF EXISTS public.application_settings_setting_;

DROP INDEX IF EXISTS public.application_settings_setting_category_setting_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS application_settings_org_category_name_key
  ON public.application_settings (organization_id, setting_category, setting_name);

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
  src.setting_value
FROM public.application_settings src
WHERE src.organization_id = 1
  AND src.setting_category = 'tab_visibility'
ON CONFLICT (organization_id, setting_category, setting_name)
DO UPDATE SET setting_value = EXCLUDED.setting_value;
