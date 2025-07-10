-- Create new application_settings table
CREATE TABLE public.application_settings (
  id SERIAL PRIMARY KEY,
  setting_category VARCHAR(50) NOT NULL,
  setting_name VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by INTEGER,
  UNIQUE(setting_category, setting_name)
);

-- Enable RLS
ALTER TABLE public.application_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage application settings" 
ON public.application_settings 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Public can read active application settings" 
ON public.application_settings 
FOR SELECT 
USING (is_active = true);

-- Migrate data from player_list_lock_settings
INSERT INTO public.application_settings (
  setting_category,
  setting_name,
  setting_value,
  is_active,
  created_at,
  created_by
)
SELECT 
  'player_list_lock' as setting_category,
  'global_lock' as setting_name,
  jsonb_build_object(
    'lock_from_date', lock_from_date,
    'updated_at', updated_at
  ) as setting_value,
  COALESCE(is_active, false) as is_active,
  COALESCE(created_at, now()) as created_at,
  created_by
FROM public.player_list_lock_settings 
WHERE id = 1;

-- Migrate data from tab_visibility_settings
INSERT INTO public.application_settings (
  setting_category,
  setting_name,
  setting_value,
  is_active,
  created_at
)
SELECT 
  'tab_visibility' as setting_category,
  setting_name,
  jsonb_build_object(
    'is_visible', is_visible,
    'requires_login', requires_login,
    'updated_at', updated_at
  ) as setting_value,
  true as is_active,
  COALESCE(created_at, now()) as created_at
FROM public.tab_visibility_settings;

-- Update is_player_list_locked function to use new table
CREATE OR REPLACE FUNCTION public.is_player_list_locked()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $function$
DECLARE
  lock_date DATE;
  is_enabled BOOLEAN;
  setting_data JSONB;
BEGIN
  SELECT setting_value, is_active 
  INTO setting_data, is_enabled
  FROM public.application_settings 
  WHERE setting_category = 'player_list_lock' 
  AND setting_name = 'global_lock'
  LIMIT 1;
  
  IF NOT is_enabled OR setting_data IS NULL THEN
    RETURN FALSE;
  END IF;
  
  lock_date := (setting_data->>'lock_from_date')::DATE;
  
  IF lock_date IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN CURRENT_DATE >= lock_date;
END;
$function$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_application_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.setting_value = NEW.setting_value || jsonb_build_object('updated_at', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_application_settings_updated_at
BEFORE UPDATE ON public.application_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_application_settings_updated_at();

-- Drop old tables
DROP TABLE public.player_list_lock_settings;
DROP TABLE public.tab_visibility_settings;