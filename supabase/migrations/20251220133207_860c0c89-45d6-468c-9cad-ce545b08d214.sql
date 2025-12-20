-- Fix the view to use security_invoker (PostgreSQL 15+) instead of security_definer
-- This makes the view respect caller's permissions while still allowing conditional logic
ALTER VIEW public.matches_with_poll_info SET (security_invoker = on);