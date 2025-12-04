-- Update existing tab visibility settings with per-role visibility structure
-- This migrates from simple is_active boolean to role-based visibility

-- First, update all tab visibility settings to have the new structure
UPDATE public.application_settings 
SET setting_value = jsonb_build_object(
  'visibility', jsonb_build_object(
    'public', COALESCE(is_active, true),
    'player_manager', true,
    'referee', true,
    'admin', true
  ),
  'requires_login', COALESCE((setting_value->>'requires_login')::boolean, false)
)
WHERE setting_category = 'tab_visibility';

-- Now apply the hardcoded logic that was in the code:
-- schorsingen: only for admin and player_manager (not public, not referee)
UPDATE public.application_settings 
SET setting_value = jsonb_set(
  jsonb_set(setting_value, '{visibility,public}', 'false'::jsonb),
  '{visibility,referee}', 'false'::jsonb
)
WHERE setting_category = 'tab_visibility' 
  AND setting_name = 'schorsingen';

-- kaarten: only for admin and referee (not public, not player_manager)
UPDATE public.application_settings 
SET setting_value = jsonb_set(
  jsonb_set(setting_value, '{visibility,public}', 'false'::jsonb),
  '{visibility,player_manager}', 'false'::jsonb
)
WHERE setting_category = 'tab_visibility' 
  AND setting_name = 'kaarten';

-- scheidsrechters: only for admin and referee (not public, not player_manager)
UPDATE public.application_settings 
SET setting_value = jsonb_set(
  jsonb_set(setting_value, '{visibility,public}', 'false'::jsonb),
  '{visibility,player_manager}', 'false'::jsonb
)
WHERE setting_category = 'tab_visibility' 
  AND setting_name = 'scheidsrechters';

-- match-forms tabs: require login, so not public
UPDATE public.application_settings 
SET setting_value = jsonb_set(setting_value, '{visibility,public}', 'false'::jsonb)
WHERE setting_category = 'tab_visibility' 
  AND setting_name IN ('match-forms-league', 'match-forms-cup', 'match-forms-playoffs');