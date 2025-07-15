-- Add teams tab to application settings
INSERT INTO public.application_settings (
  setting_name,
  setting_category,
  setting_value,
  is_active,
  created_at,
  updated_at
) VALUES (
  'teams',
  'tab_visibility',
  '{"is_visible": true, "requires_login": false}',
  true,
  NOW(),
  NOW()
) ON CONFLICT (setting_name, setting_category) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Log the migration
INSERT INTO public.migration_logs (
  migration_name,
  executed_at,
  details
) VALUES (
  'add_teams_tab',
  NOW(),
  'Teams tab added to application settings with visibility enabled for all users'
); 