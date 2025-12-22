-- Activate the playoff tab visibility setting
UPDATE public.application_settings 
SET is_active = true, 
    updated_at = now() 
WHERE setting_name = 'playoff' 
  AND setting_category = 'tab_visibility';