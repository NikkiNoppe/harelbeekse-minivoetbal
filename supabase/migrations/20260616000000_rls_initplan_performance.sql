-- Lint 0003 auth_rls_initplan: wrap current_setting / auth.* / role helpers in (SELECT …)
-- so Postgres evaluates once per query (InitPlan), not per row.

-- matches
DROP POLICY IF EXISTS "Require user context for matches access" ON public.matches;
CREATE POLICY "Require user context for matches access"
ON public.matches
AS RESTRICTIVE
FOR ALL
TO public
USING (
  COALESCE(NULLIF((SELECT current_setting('app.current_user_role', true)), ''), '') <> ''
);

DROP POLICY IF EXISTS "Referees can read assigned matches" ON public.matches;
CREATE POLICY "Referees can read assigned matches"
ON public.matches
FOR SELECT
TO public
USING (
  (SELECT get_current_user_role()) = 'referee'
  AND (
    assigned_referee_id = NULLIF((SELECT current_setting('app.current_user_id', true)), '')::integer
    OR (
      referee IS NOT NULL
      AND referee <> ''
      AND referee = COALESCE(NULLIF((SELECT current_setting('app.current_user_username', true)), ''), '')
    )
  )
);

-- password_reset_tokens
DROP POLICY IF EXISTS "Only service role can update reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Only service role can update reset tokens"
ON public.password_reset_tokens
FOR UPDATE
TO public
USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role can create reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Service role can create reset tokens"
ON public.password_reset_tokens
FOR INSERT
TO public
WITH CHECK ((SELECT auth.role()) = 'service_role');

-- team_users
DROP POLICY IF EXISTS "Team managers can read their own team relations" ON public.team_users;
CREATE POLICY "Team managers can read their own team relations"
ON public.team_users
FOR SELECT
TO authenticated
USING (
  (SELECT get_current_user_role()) = 'admin'
  OR (
    (SELECT get_current_user_role()) = 'player_manager'
    AND user_id = (SELECT current_setting('app.current_user_id', true))::integer
  )
);

-- users
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
CREATE POLICY "Users can read their own data"
ON public.users
FOR SELECT
TO public
USING (user_id = (SELECT current_setting('app.current_user_id', true))::integer);

-- team_costs
DROP POLICY IF EXISTS "Allow authenticated operations on team_costs" ON public.team_costs;
CREATE POLICY "Allow authenticated operations on team_costs"
ON public.team_costs
FOR ALL
TO public
USING (
  pg_trigger_depth() > 0
  OR (SELECT get_current_user_role()) = 'admin'
  OR (SELECT auth.role()) = 'service_role'
)
WITH CHECK (
  pg_trigger_depth() > 0
  OR (SELECT get_current_user_role()) = 'admin'
  OR (SELECT auth.role()) = 'service_role'
);

DROP POLICY IF EXISTS "Referees can add penalties for their matches" ON public.team_costs;
CREATE POLICY "Referees can add penalties for their matches"
ON public.team_costs
FOR INSERT
TO public
WITH CHECK (
  (SELECT get_current_user_role()) = 'referee'
  AND match_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM matches m
    JOIN users u ON u.user_id = (SELECT current_setting('app.current_user_id', true))::integer
    WHERE m.match_id = team_costs.match_id
      AND (
        m.assigned_referee_id = u.user_id
        OR m.referee = u.username::text
      )
  )
);

-- referee_matches
DROP POLICY IF EXISTS "Referees read own referee_matches" ON public.referee_matches;
CREATE POLICY "Referees read own referee_matches"
ON public.referee_matches
FOR SELECT
TO public
USING (referee_id = (SELECT current_setting('app.current_user_id', true))::integer);

DROP POLICY IF EXISTS "Referees insert own availability" ON public.referee_matches;
CREATE POLICY "Referees insert own availability"
ON public.referee_matches
FOR INSERT
TO public
WITH CHECK (referee_id = (SELECT current_setting('app.current_user_id', true))::integer);

DROP POLICY IF EXISTS "Referees update own assignment status" ON public.referee_matches;
CREATE POLICY "Referees update own assignment status"
ON public.referee_matches
FOR UPDATE
TO public
USING (
  referee_id = (SELECT current_setting('app.current_user_id', true))::integer
  AND (SELECT get_current_user_role()) = 'referee'
)
WITH CHECK (
  referee_id = (SELECT current_setting('app.current_user_id', true))::integer
  AND (SELECT get_current_user_role()) = 'referee'
);
