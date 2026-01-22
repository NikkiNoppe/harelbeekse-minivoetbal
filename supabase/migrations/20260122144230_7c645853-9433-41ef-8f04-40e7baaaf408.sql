-- Create a secure view for referee data that excludes email addresses
-- This prevents direct email harvesting while maintaining functionality

CREATE OR REPLACE VIEW public.referees_public
WITH (security_invoker=on) AS
SELECT user_id, username, role
FROM public.users
WHERE role = 'referee';

-- Grant appropriate permissions
GRANT SELECT ON public.referees_public TO authenticated;
GRANT SELECT ON public.referees_public TO anon;

-- Add comment for documentation
COMMENT ON VIEW public.referees_public IS 'Secure view for referee data - excludes email addresses to prevent harvesting. Application should query this view instead of users table for referee lists.';