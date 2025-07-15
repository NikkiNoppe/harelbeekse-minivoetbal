-- Add default suspension rules to application_settings
INSERT INTO public.application_settings (setting_category, setting_name, setting_value, is_active, created_at) 
VALUES (
  'suspension_rules',
  'default_rules',
  '{
    "yellow_card_rules": [
      {"min_cards": 2, "max_cards": 3, "suspension_matches": 1},
      {"min_cards": 4, "max_cards": 5, "suspension_matches": 2},
      {"min_cards": 6, "max_cards": 999, "suspension_matches": 3}
    ],
    "red_card_rules": {
      "default_suspension_matches": 1,
      "admin_can_modify": true,
      "max_suspension_matches": 5
    },
    "reset_rules": {
      "reset_yellow_cards_after_matches": 10,
      "reset_at_season_end": true
    }
  }'::jsonb,
  true,
  NOW()
) ON CONFLICT DO NOTHING;