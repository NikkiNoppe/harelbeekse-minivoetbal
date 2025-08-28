-- Upsert correct admin match forms visibility settings
INSERT INTO application_settings (setting_category, setting_name, setting_value, is_active, created_at, updated_at)
VALUES 
  ('tab_visibility', 'admin_match_forms_league', '{"requires_login": true}', true, now(), now()),
  ('tab_visibility', 'admin_match_forms_cup', '{"requires_login": true}', true, now(), now()),
  ('tab_visibility', 'admin_match_forms_playoffs', '{"requires_login": true}', true, now(), now())
ON CONFLICT (setting_category, setting_name) 
DO UPDATE SET 
  is_active = EXCLUDED.is_active,
  setting_value = EXCLUDED.setting_value,
  updated_at = EXCLUDED.updated_at;