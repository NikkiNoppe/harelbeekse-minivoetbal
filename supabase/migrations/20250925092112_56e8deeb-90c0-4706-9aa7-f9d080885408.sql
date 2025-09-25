-- Enable scheidsrechters tab visibility
UPDATE application_settings 
SET is_active = true 
WHERE setting_name = 'scheidsrechters' AND setting_category = 'tab_visibility';