-- Allow clients to call the stable forfait check (SECURITY DEFINER) for sync guards.
GRANT EXECUTE ON FUNCTION public.match_has_forfait_penalty(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_has_forfait_penalty(integer) TO service_role;
