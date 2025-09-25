-- Fix referee_polls access in application_settings
-- Date: 2025-09-25
-- Description: Add RLS policy for referee_polls category

-- Create policy for public to read referee_polls settings
CREATE POLICY "Public can read referee polls settings" 
ON public.application_settings 
FOR SELECT 
USING (
  setting_category = 'referee_polls' 
  AND is_active = true
);

-- Create policy for authenticated users to manage referee_polls settings
CREATE POLICY "Authenticated users can manage referee polls settings" 
ON public.application_settings 
FOR ALL 
USING (
  setting_category = 'referee_polls' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  setting_category = 'referee_polls' 
  AND auth.role() = 'authenticated'
);

-- Create policy for public to read admin_notifications
CREATE POLICY "Public can read admin notifications" 
ON public.application_settings 
FOR SELECT 
USING (
  setting_category = 'admin_notifications' 
  AND is_active = true
);

-- Create policy for authenticated users to manage admin_notifications
CREATE POLICY "Authenticated users can manage admin notifications" 
ON public.application_settings 
FOR ALL 
USING (
  setting_category = 'admin_notifications' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  setting_category = 'admin_notifications' 
  AND auth.role() = 'authenticated'
);
