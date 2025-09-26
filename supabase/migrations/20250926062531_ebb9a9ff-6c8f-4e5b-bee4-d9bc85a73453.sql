-- Create a test notification that is currently active
INSERT INTO application_settings (
  setting_category,
  setting_name,
  setting_value,
  is_active
) VALUES (
  'notifications',
  'test_notification_active',
  '{
    "message": "🎉 Welkom terug! Deze notificatie test werkt correct.",
    "type": "success",
    "target_roles": ["admin"],
    "start_date": "2025-09-25",
    "end_date": "2025-09-28",
    "duration": 8
  }',
  true
);

-- Also create a notification without end date (always active)
INSERT INTO application_settings (
  setting_category,
  setting_name,
  setting_value,
  is_active
) VALUES (
  'notifications',
  'persistent_notification',
  '{
    "message": "📢 Dit is een blijvende notificatie voor admins.",
    "type": "info", 
    "target_roles": ["admin"],
    "start_date": "2025-09-25",
    "duration": 6
  }',
  true
);