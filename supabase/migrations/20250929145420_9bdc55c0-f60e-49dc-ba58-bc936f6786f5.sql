-- Update test notification to be admin-only
UPDATE public.application_settings 
SET setting_value = jsonb_build_object(
  'message', 'Test notificatie voor admin gebruikers',
  'type', 'info',
  'target_roles', ARRAY['admin'],
  'duration', 8
)
WHERE setting_category = 'notifications' 
AND setting_name = 'debug_test_notification';