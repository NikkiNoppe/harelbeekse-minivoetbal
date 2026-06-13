UPDATE public.application_settings
SET setting_value = jsonb_set(setting_value, '{allow_multiple}', 'true'::jsonb, true)
WHERE setting_category = 'profile_polls' AND id = 162;