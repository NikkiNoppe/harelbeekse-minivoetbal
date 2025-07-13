-- Fix application_settings RLS policies to allow proper access
-- Date: 2025-01-17
-- Description: Update RLS policies to allow public read access to season_data and priority_order

-- Drop existing policies
DROP POLICY IF EXISTS "Public can read blog posts" ON public.application_settings;
DROP POLICY IF EXISTS "Admins can manage all application settings" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read other active settings" ON public.application_settings;

-- Create policy for public to read season_data and priority_order
CREATE POLICY "Public can read season and priority data" 
ON public.application_settings 
FOR SELECT 
USING (
  (setting_category = 'season_data' OR setting_category = 'priority_order') 
  AND is_active = true
);

-- Create policy for public to read blog_posts
CREATE POLICY "Public can read blog posts" 
ON public.application_settings 
FOR SELECT 
USING (
  setting_category = 'blog_posts' 
  AND is_active = true
);

-- Create policy for public to read tab_visibility settings
CREATE POLICY "Public can read tab visibility settings" 
ON public.application_settings 
FOR SELECT 
USING (
  setting_category = 'tab_visibility' 
  AND is_active = true
);

-- Create policy for public to read player_list_lock settings
CREATE POLICY "Public can read player list lock settings" 
ON public.application_settings 
FOR SELECT 
USING (
  setting_category = 'player_list_lock' 
  AND is_active = true
);

-- Create policy for admins to manage all settings
CREATE POLICY "Admins can manage all application settings" 
ON public.application_settings 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Ensure the is_admin_user function exists
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if current user is authenticated and has admin role
  IF auth.role() = 'authenticated' THEN
    -- Check if user has admin role in users table
    RETURN EXISTS (
      SELECT 1 FROM public.users 
      WHERE user_id = auth.uid()::integer 
      AND role = 'admin'
    );
  END IF;
  
  RETURN FALSE;
END;
$$; 