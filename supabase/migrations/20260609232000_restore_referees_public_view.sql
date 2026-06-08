-- Scheidsrechterslijst voor wedstrijdformulieren (geen e-mail, geen users-RLS nodig).
-- Was verwijderd in 20260514073539; nodig na REVOKE SELECT ON users FROM anon.

DROP VIEW IF EXISTS public.referees_public;

CREATE VIEW public.referees_public
WITH (security_invoker = false)
AS
SELECT
  u.user_id,
  u.username::text AS username
FROM public.users u
WHERE u.role::text = 'referee';

GRANT SELECT ON public.referees_public TO anon, authenticated;

COMMENT ON VIEW public.referees_public IS
  'Referee usernames for match forms and assignments. Excludes email. security_invoker=false bypasses users RLS.';
