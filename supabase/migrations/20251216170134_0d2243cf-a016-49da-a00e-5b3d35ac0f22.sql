-- Insert default playoff tab visibility setting (hidden for public by default)
INSERT INTO public.application_settings (setting_category, setting_name, setting_value, is_active)
VALUES (
  'tab_visibility', 
  'playoff',
  '{"visibility": {"public": false, "player_manager": false, "referee": false, "admin": true}, "requires_login": false}'::jsonb,
  false
)
ON CONFLICT (setting_category, setting_name) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  is_active = EXCLUDED.is_active,
  updated_at = now();