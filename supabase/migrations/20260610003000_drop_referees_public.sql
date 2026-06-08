-- Remove anon-accessible referees_public bypass view.

REVOKE SELECT ON public.referees_public FROM anon, authenticated;
DROP VIEW IF EXISTS public.referees_public;
