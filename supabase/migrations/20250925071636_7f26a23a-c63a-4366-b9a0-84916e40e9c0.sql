-- Add scheidsrechters tab visibility setting
INSERT INTO public.application_settings (setting_category, setting_name, setting_value, is_active)
VALUES (
  'tab_visibility',
  'scheidsrechters',
  '{"is_visible": true, "requires_login": true}',
  true
) ON CONFLICT (setting_category, setting_name) DO NOTHING;