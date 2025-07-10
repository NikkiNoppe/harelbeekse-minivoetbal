-- Drop the blogs table after successful migration to application_settings
-- Only run this after verifying that all blog posts have been migrated successfully

-- First, verify that all blog posts are in application_settings
SELECT 
  'blogs table' as source,
  COUNT(*) as count
FROM blogs
UNION ALL
SELECT 
  'application_settings' as source,
  COUNT(*) as count
FROM application_settings 
WHERE setting_category = 'blog_posts';

-- If the counts match, you can safely drop the blogs table
-- DROP TABLE IF EXISTS blogs;

-- Verify the blogs table is gone
-- SELECT * FROM blogs; -- This should give an error if table is dropped 