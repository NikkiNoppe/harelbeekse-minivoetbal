-- Archief-tab voor seizoen 2026-2027 (leeg; admin vult via archiveren-modals).

INSERT INTO public.application_settings (
  setting_category,
  setting_name,
  setting_value
)
SELECT
  'season_archives',
  '2026-2027',
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1
  FROM public.application_settings
  WHERE setting_category = 'season_archives'
    AND setting_name = '2026-2027'
);
