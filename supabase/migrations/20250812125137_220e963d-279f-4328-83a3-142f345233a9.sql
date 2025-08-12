
-- Voeg (of werk bij) zichtbaarheid voor admin Wedstrijdformulieren
INSERT INTO public.application_settings (
  setting_name,
  setting_category,
  setting_value,
  is_active,
  created_at,
  updated_at
) VALUES
  ('admin_match_forms_league', 'tab_visibility', '{"is_visible": true, "requires_login": true}', true, NOW(), NOW()),
  ('admin_match_forms_cup',     'tab_visibility', '{"is_visible": true, "requires_login": true}', true, NOW(), NOW()),
  ('admin_match_forms_playoffs','tab_visibility', '{"is_visible": true, "requires_login": true}', true, NOW(), NOW())
ON CONFLICT (setting_name, setting_category) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  is_active     = EXCLUDED.is_active,
  updated_at    = NOW();
