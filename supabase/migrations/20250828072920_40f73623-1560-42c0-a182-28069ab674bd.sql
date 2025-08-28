-- Insert missing match forms tab visibility settings
INSERT INTO application_settings (setting_category, setting_name, setting_value, is_active, created_at, updated_at)
VALUES 
  ('tab_visibility', 'match-forms-league', '{"requires_login": true}', true, now(), now()),
  ('tab_visibility', 'match-forms-cup', '{"requires_login": true}', true, now(), now()),
  ('tab_visibility', 'match-forms-playoffs', '{"requires_login": true}', true, now(), now())
ON CONFLICT (setting_category, setting_name) 
DO UPDATE SET 
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;