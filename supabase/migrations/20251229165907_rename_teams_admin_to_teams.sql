-- Rename teams-admin setting to teams for consistency
-- This migration renames the admin teams tab visibility setting from 'teams-admin' to 'teams'
-- while maintaining backward compatibility

-- First, check if 'teams' setting already exists (for public teams page)
-- If it exists, we'll keep both: 'teams' for public and we'll use a different approach
-- If it doesn't exist, we can safely rename 'teams-admin' to 'teams'

-- Step 1: If 'teams-admin' exists, copy its data to 'teams' (if 'teams' doesn't exist)
INSERT INTO application_settings (setting_category, setting_name, setting_value, is_active, created_at, updated_at)
SELECT 
  setting_category,
  'teams' as setting_name,
  setting_value,
  is_active,
  created_at,
  updated_at
FROM application_settings
WHERE setting_category = 'tab_visibility' 
  AND setting_name = 'teams-admin'
  AND NOT EXISTS (
    SELECT 1 FROM application_settings 
    WHERE setting_category = 'tab_visibility' 
    AND setting_name = 'teams'
  )
ON CONFLICT (setting_category, setting_name) DO NOTHING;

-- Step 2: Update any existing 'teams' setting to use the admin teams visibility if 'teams-admin' exists
-- This ensures the admin teams page uses the correct visibility settings
UPDATE application_settings
SET 
  setting_value = (
    SELECT setting_value 
    FROM application_settings 
    WHERE setting_category = 'tab_visibility' 
    AND setting_name = 'teams-admin'
    LIMIT 1
  ),
  updated_at = NOW()
WHERE setting_category = 'tab_visibility' 
  AND setting_name = 'teams'
  AND EXISTS (
    SELECT 1 FROM application_settings 
    WHERE setting_category = 'tab_visibility' 
    AND setting_name = 'teams-admin'
  );

-- Step 3: Delete the old 'teams-admin' setting (optional - we keep it for backward compatibility)
-- Uncomment the line below if you want to remove 'teams-admin' completely
-- DELETE FROM application_settings WHERE setting_category = 'tab_visibility' AND setting_name = 'teams-admin';

-- Note: We keep 'teams-admin' for backward compatibility in case any code still references it
-- The code will check for 'teams' first, then fall back to 'teams-admin' if needed

