-- Hide sensitive columns from direct PostgREST reads.
-- All app code that needs these columns goes through SECURITY DEFINER RPCs
-- (private.* and public *_for_session wrappers), which run as the table owner
-- and bypass column-level GRANTs.

-- 1. Hide bcrypt password hashes on users table from direct reads
REVOKE SELECT (password) ON public.users FROM anon, authenticated;

-- 2. Hide team contact PII from direct reads
REVOKE SELECT (contact_email, contact_phone, contact_person) ON public.teams FROM anon, authenticated;