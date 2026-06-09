-- Restrict team contact PII: only via get_teams_for_session (SECURITY DEFINER).
-- Direct teams SELECT for authenticated users exposes team_id/name/colors only.

REVOKE SELECT (contact_person, contact_phone, contact_email) ON public.teams FROM authenticated;

DROP POLICY IF EXISTS "Session context can read teams" ON public.teams;

CREATE POLICY "Admins can read teams"
ON public.teams
FOR SELECT
USING (get_current_user_role() = 'admin');

CREATE POLICY "Team managers can read teams"
ON public.teams
FOR SELECT
USING (get_current_user_role() = 'player_manager');

CREATE POLICY "Referees can read team names"
ON public.teams
FOR SELECT
USING (get_current_user_role() = 'referee');

COMMENT ON POLICY "Admins can read teams" ON public.teams IS
  'Team names and non-contact fields. Contact PII via get_teams_for_session only.';
COMMENT ON POLICY "Team managers can read teams" ON public.teams IS
  'Team names and non-contact fields. Contact PII via get_teams_for_session only.';
COMMENT ON POLICY "Referees can read team names" ON public.teams IS
  'Referees: team_id/team_name only (contact columns revoked for authenticated).';
