-- Migrate existing 'notifications' category to 'admin_messages'
UPDATE public.application_settings 
SET setting_category = 'admin_messages'
WHERE setting_category = 'notifications'
AND setting_category != 'admin_messages';

-- Also migrate 'admin_notifications' if any exist
UPDATE public.application_settings 
SET setting_category = 'admin_messages'
WHERE setting_category = 'admin_notifications'
AND setting_category != 'admin_messages';