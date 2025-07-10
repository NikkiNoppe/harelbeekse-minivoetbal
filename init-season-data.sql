-- Migrate blogs data to application_settings table
-- This script moves all blog posts from the blogs table to application_settings
-- Each blog post becomes a separate setting with category 'blog_posts'

-- First, let's see what blog posts exist
SELECT * FROM blogs;

-- Migrate each blog post to application_settings
INSERT INTO public.application_settings (
  setting_category,
  setting_name,
  setting_value,
  is_active,
  created_at
)
SELECT 
  'blog_posts' as setting_category,
  'post_' || id as setting_name,
  jsonb_build_object(
    'id', id,
    'title', title,
    'content', content,
    'date', date,
    'tags', COALESCE(tags, '[]'::jsonb)
  ) as setting_value,
  true as is_active,
  COALESCE(created_at, now()) as created_at
FROM blogs
ON CONFLICT (setting_category, setting_name) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();

-- Verify the migration
SELECT 
  setting_category,
  setting_name,
  setting_value->>'title' as title,
  setting_value->>'date' as date
FROM application_settings 
WHERE setting_category = 'blog_posts'
ORDER BY setting_value->>'date' DESC;