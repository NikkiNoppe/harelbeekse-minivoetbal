-- Security hardening: column-level revokes for sensitive data + tighten team_costs RLS

-- 1) Revoke password column from clients (only SECURITY DEFINER funcs may read it)
REVOKE SELECT (password) ON public.users FROM anon, authenticated;

-- 2) Revoke contact PII from anonymous; keep for authenticated (admins/managers need it)
REVOKE SELECT (contact_person, contact_phone, contact_email) ON public.teams FROM anon;

-- 3) Revoke referee_notes from anonymous (contains internal/penalty notes)
REVOKE SELECT (referee_notes) ON public.matches FROM anon;

-- 4) Tighten team_costs: drop blanket public SELECT, restrict to admin + own-team manager
DROP POLICY IF EXISTS "Public can read team costs" ON public.team_costs;

CREATE POLICY "Admins and team managers can read team costs"
ON public.team_costs
FOR SELECT
USING (
  get_current_user_role() = 'admin'
  OR (
    get_current_user_role() = 'player_manager'
    AND team_id = ANY (get_current_user_team_ids())
  )
);