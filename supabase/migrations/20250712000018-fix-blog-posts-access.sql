-- Fix blog posts access for public users
-- This migration ensures that blog_posts can be read by everyone, not just admins

-- Drop existing policies for application_settings
DROP POLICY IF EXISTS "Admins can manage application settings" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read active application settings" ON public.application_settings;

-- Create new policies that allow public read access for blog_posts
CREATE POLICY "Public can read blog posts" 
ON public.application_settings 
FOR SELECT 
USING (
  setting_category = 'blog_posts' 
  AND is_active = true
);

-- Create policy for admins to manage all settings
CREATE POLICY "Admins can manage all application settings" 
ON public.application_settings 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Create policy for public to read other active settings (non-blog_posts)
CREATE POLICY "Public can read other active settings" 
ON public.application_settings 
FOR SELECT 
USING (
  setting_category != 'blog_posts' 
  AND is_active = true
); 