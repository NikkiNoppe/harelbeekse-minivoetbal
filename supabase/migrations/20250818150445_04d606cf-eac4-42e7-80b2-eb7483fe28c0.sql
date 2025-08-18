-- Ensure all tab visibility settings exist with proper structure
INSERT INTO application_settings (setting_name, setting_category, setting_value, is_active, created_at, updated_at)
VALUES 
  ('algemeen', 'tab_visibility', '{"is_visible": true, "requires_login": false}'::jsonb, true, now(), now()),
  ('competitie', 'tab_visibility', '{"is_visible": true, "requires_login": false}'::jsonb, true, now(), now()),
  ('playoff', 'tab_visibility', '{"is_visible": true, "requires_login": false}'::jsonb, true, now(), now()),
  ('beker', 'tab_visibility', '{"is_visible": true, "requires_login": false}'::jsonb, true, now(), now()),
  ('schorsingen', 'tab_visibility', '{"is_visible": true, "requires_login": false}'::jsonb, true, now(), now()),
  ('reglement', 'tab_visibility', '{"is_visible": true, "requires_login": false}'::jsonb, true, now(), now()),
  ('teams', 'tab_visibility', '{"is_visible": true, "requires_login": false}'::jsonb, true, now(), now()),
  ('admin_match_forms_league', 'tab_visibility', '{"is_visible": true, "requires_login": true}'::jsonb, true, now(), now()),
  ('admin_match_forms_cup', 'tab_visibility', '{"is_visible": true, "requires_login": true}'::jsonb, true, now(), now()),
  ('admin_match_forms_playoffs', 'tab_visibility', '{"is_visible": true, "requires_login": true}'::jsonb, true, now(), now())
ON CONFLICT (setting_name, setting_category) 
DO UPDATE SET
  is_active = true,
  updated_at = now(),
  setting_value = CASE 
    WHEN EXCLUDED.setting_name LIKE 'admin_match_forms_%' 
    THEN '{"is_visible": true, "requires_login": true}'::jsonb
    ELSE '{"is_visible": true, "requires_login": false}'::jsonb
  END;