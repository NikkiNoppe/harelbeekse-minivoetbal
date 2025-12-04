-- Add missing tab visibility settings for all menu items
INSERT INTO application_settings (setting_category, setting_name, setting_value, is_active)
VALUES 
  -- BEHEER tabs
  ('tab_visibility', 'players', '{"requires_login": true, "visibility": {"public": false, "player_manager": true, "referee": false, "admin": true}}', true),
  ('tab_visibility', 'users', '{"requires_login": true, "visibility": {"public": false, "player_manager": false, "referee": false, "admin": true}}', true),
  ('tab_visibility', 'teams-admin', '{"requires_login": true, "visibility": {"public": false, "player_manager": false, "referee": false, "admin": true}}', true),
  -- FINANCIEEL
  ('tab_visibility', 'financial', '{"requires_login": true, "visibility": {"public": false, "player_manager": false, "referee": false, "admin": true}}', true),
  -- SPEELFORMATEN (admin)
  ('tab_visibility', 'format-competition', '{"requires_login": true, "visibility": {"public": false, "player_manager": false, "referee": false, "admin": true}}', true),
  ('tab_visibility', 'format-cup', '{"requires_login": true, "visibility": {"public": false, "player_manager": false, "referee": false, "admin": true}}', true),
  ('tab_visibility', 'format-playoffs', '{"requires_login": true, "visibility": {"public": false, "player_manager": false, "referee": false, "admin": true}}', true),
  -- SYSTEEM tabs
  ('tab_visibility', 'settings', '{"requires_login": true, "visibility": {"public": false, "player_manager": false, "referee": false, "admin": true}}', true),
  ('tab_visibility', 'blog-management', '{"requires_login": true, "visibility": {"public": false, "player_manager": false, "referee": false, "admin": true}}', true),
  ('tab_visibility', 'notification-management', '{"requires_login": true, "visibility": {"public": false, "player_manager": false, "referee": false, "admin": true}}', true)
ON CONFLICT DO NOTHING;