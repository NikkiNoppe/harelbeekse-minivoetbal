-- Check current season data in application_settings
SELECT 
  setting_category,
  setting_name,
  setting_value
FROM application_settings 
WHERE setting_category = 'season_data' 
  AND setting_name = 'main_config' 
  AND is_active = true;

-- Check if there are any timeslots configured
SELECT 
  setting_value->>'venue_timeslots' as timeslots
FROM application_settings 
WHERE setting_category = 'season_data' 
  AND setting_name = 'main_config' 
  AND is_active = true;

-- Check if there are any venues configured
SELECT 
  setting_value->>'venues' as venues
FROM application_settings 
WHERE setting_category = 'season_data' 
  AND setting_name = 'main_config' 
  AND is_active = true; 