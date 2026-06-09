-- Lint 0006 multiple_permissive_policies: drop redundant policies and merge per-action OR expressions.

-- ── users: admin ALL already covers per-action admin policies ──
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins can create users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read referees" ON public.users;
CREATE POLICY "Read users by role"
ON public.users
FOR SELECT
TO public
USING (
  (SELECT get_current_user_role()) = 'admin'
  OR user_id = (SELECT current_setting('app.current_user_id', true))::integer
  OR (
    (SELECT get_current_user_role()) IS NOT NULL
    AND (SELECT get_current_user_role()) <> ''
    AND role = 'referee'::user_role
  )
);

-- ── application_settings: admin ALL + merged SELECT ──
DROP POLICY IF EXISTS "Only admins can delete application settings" ON public.application_settings;
DROP POLICY IF EXISTS "Only admins can write application settings" ON public.application_settings;
DROP POLICY IF EXISTS "Only admins can update application settings" ON public.application_settings;

DROP POLICY IF EXISTS "Authenticated users can read admin messages" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read admin notifications" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read blog posts" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read match form settings" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read player list lock settings" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read referee polls settings" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read season and priority data" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read season archives" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read tab visibility settings" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read theme colors" ON public.application_settings;
DROP POLICY IF EXISTS "Team managers can read automatic suspension overrides for their" ON public.application_settings;
DROP POLICY IF EXISTS "Team managers can read suspension rules" ON public.application_settings;
DROP POLICY IF EXISTS "Team managers can read their team suspensions" ON public.application_settings;

CREATE POLICY "Read application settings by role and category"
ON public.application_settings
FOR SELECT
TO public
USING (
  (SELECT is_admin_user())
  OR setting_category::text = 'admin_notifications'
  OR setting_category::text = 'blog_posts'
  OR setting_category::text = 'match_form_settings'
  OR setting_category::text = 'player_list_lock'
  OR setting_category::text = 'referee_polls'
  OR setting_category::text = ANY (ARRAY['season_data', 'priority_order'])
  OR setting_category::text = 'season_archives'
  OR setting_category::text = 'tab_visibility'
  OR setting_category::text = 'theme_colors'
  OR (
    setting_category::text = 'admin_messages'
    AND (SELECT get_current_user_role()) = ANY (ARRAY['admin', 'player_manager', 'referee'])
  )
  OR (
    setting_category::text = 'suspension_rules'
    AND (SELECT get_current_user_role()) = 'player_manager'
  )
  OR (
    setting_category::text = 'automatic_suspension_overrides'
    AND (SELECT get_current_user_role()) = 'player_manager'
    AND split_part(setting_name::text, ':', 1)::integer IN (
      SELECT players.player_id
      FROM players
      WHERE players.team_id = ANY (get_current_user_team_ids())
    )
  )
  OR (
    setting_category::text = 'manual_suspensions'
    AND (SELECT get_current_user_role()) = 'player_manager'
    AND setting_name::integer IN (
      SELECT players.player_id
      FROM players
      WHERE players.team_id = ANY (get_current_user_team_ids())
    )
  )
);

-- ── costs: one public read policy ──
DROP POLICY IF EXISTS "costs_anon_policy" ON public.costs;
DROP POLICY IF EXISTS "Authenticated users can read costs" ON public.costs;

-- ── matches: merged SELECT + UPDATE; drop redundant admin read ──
DROP POLICY IF EXISTS "Admins can read all matches" ON public.matches;
DROP POLICY IF EXISTS "Team managers can read their team matches" ON public.matches;
DROP POLICY IF EXISTS "Referees can read assigned matches" ON public.matches;
DROP POLICY IF EXISTS "Team managers can update their team matches" ON public.matches;
DROP POLICY IF EXISTS "Only admins can manage matches" ON public.matches;

CREATE POLICY "Read matches by role"
ON public.matches
FOR SELECT
TO public
USING (
  (SELECT get_current_user_role()) = 'admin'
  OR (
    (SELECT get_current_user_role()) = 'player_manager'
    AND (
      home_team_id = ANY (get_current_user_team_ids())
      OR away_team_id = ANY (get_current_user_team_ids())
    )
  )
  OR (
    (SELECT get_current_user_role()) = 'referee'
    AND (
      assigned_referee_id = NULLIF((SELECT current_setting('app.current_user_id', true)), '')::integer
      OR (
        referee IS NOT NULL
        AND referee <> ''
        AND referee = COALESCE(NULLIF((SELECT current_setting('app.current_user_username', true)), ''), '')
      )
    )
  )
);

CREATE POLICY "Update matches by role"
ON public.matches
FOR UPDATE
TO public
USING (
  (SELECT get_current_user_role()) = 'admin'
  OR (
    (SELECT get_current_user_role()) = 'player_manager'
    AND (
      home_team_id = ANY (get_current_user_team_ids())
      OR away_team_id = ANY (get_current_user_team_ids())
    )
  )
)
WITH CHECK (
  (SELECT get_current_user_role()) = 'admin'
  OR (
    (SELECT get_current_user_role()) = 'player_manager'
    AND (
      home_team_id = ANY (get_current_user_team_ids())
      OR away_team_id = ANY (get_current_user_team_ids())
    )
  )
);

CREATE POLICY "Insert matches as admin"
ON public.matches
FOR INSERT
TO public
WITH CHECK ((SELECT get_current_user_role()) = 'admin');

CREATE POLICY "Delete matches as admin"
ON public.matches
FOR DELETE
TO public
USING ((SELECT get_current_user_role()) = 'admin');

-- ── players: one SELECT + write policies (no overlapping ALL) ──
DROP POLICY IF EXISTS "Only admins can read all player data" ON public.players;
DROP POLICY IF EXISTS "Team managers can read their players data" ON public.players;
DROP POLICY IF EXISTS "Match participants can read relevant players" ON public.players;
DROP POLICY IF EXISTS "Admins can manage all players" ON public.players;
DROP POLICY IF EXISTS "Team managers can manage their team players" ON public.players;

CREATE POLICY "Read players by role"
ON public.players
FOR SELECT
TO public
USING (
  (SELECT get_current_user_role()) = 'admin'
  OR (
    (SELECT get_current_user_role()) = 'player_manager'
    AND team_id = ANY (get_current_user_team_ids())
  )
  OR can_read_player_for_match(team_id)
);

CREATE POLICY "Insert players by role"
ON public.players
FOR INSERT
TO public
WITH CHECK (
  (SELECT get_current_user_role()) = 'admin'
  OR (
    (SELECT get_current_user_role()) = 'player_manager'
    AND team_id = ANY (get_current_user_team_ids())
  )
);

CREATE POLICY "Update players by role"
ON public.players
FOR UPDATE
TO public
USING (
  (SELECT get_current_user_role()) = 'admin'
  OR (
    (SELECT get_current_user_role()) = 'player_manager'
    AND team_id = ANY (get_current_user_team_ids())
  )
)
WITH CHECK (
  (SELECT get_current_user_role()) = 'admin'
  OR (
    (SELECT get_current_user_role()) = 'player_manager'
    AND team_id = ANY (get_current_user_team_ids())
  )
);

CREATE POLICY "Delete players by role"
ON public.players
FOR DELETE
TO public
USING (
  (SELECT get_current_user_role()) = 'admin'
  OR (
    (SELECT get_current_user_role()) = 'player_manager'
    AND team_id = ANY (get_current_user_team_ids())
  )
);

-- ── referee_matches: one policy per action (admin OR referee) ──
DROP POLICY IF EXISTS "Admins manage referee_matches" ON public.referee_matches;
DROP POLICY IF EXISTS "Referees read own referee_matches" ON public.referee_matches;
DROP POLICY IF EXISTS "Referees insert own availability" ON public.referee_matches;
DROP POLICY IF EXISTS "Referees update own assignment status" ON public.referee_matches;

CREATE POLICY "Read referee_matches by role"
ON public.referee_matches
FOR SELECT
TO public
USING (
  (SELECT get_current_user_role()) = 'admin'
  OR referee_id = (SELECT current_setting('app.current_user_id', true))::integer
);

CREATE POLICY "Insert referee_matches by role"
ON public.referee_matches
FOR INSERT
TO public
WITH CHECK (
  (SELECT get_current_user_role()) = 'admin'
  OR referee_id = (SELECT current_setting('app.current_user_id', true))::integer
);

CREATE POLICY "Update referee_matches by role"
ON public.referee_matches
FOR UPDATE
TO public
USING (
  (SELECT get_current_user_role()) = 'admin'
  OR (
    referee_id = (SELECT current_setting('app.current_user_id', true))::integer
    AND (SELECT get_current_user_role()) = 'referee'
  )
)
WITH CHECK (
  (SELECT get_current_user_role()) = 'admin'
  OR (
    referee_id = (SELECT current_setting('app.current_user_id', true))::integer
    AND (SELECT get_current_user_role()) = 'referee'
  )
);

CREATE POLICY "Delete referee_matches by role"
ON public.referee_matches
FOR DELETE
TO public
USING ((SELECT get_current_user_role()) = 'admin');

-- ── team_costs: drop duplicate admin ALL ──
DROP POLICY IF EXISTS "Admins can manage team costs" ON public.team_costs;

DROP POLICY IF EXISTS "Admins and team managers can read team costs" ON public.team_costs;
DROP POLICY IF EXISTS "Referees can add penalties for their matches" ON public.team_costs;
DROP POLICY IF EXISTS "Allow authenticated operations on team_costs" ON public.team_costs;

CREATE POLICY "Manage team_costs by role"
ON public.team_costs
FOR ALL
TO public
USING (
  pg_trigger_depth() > 0
  OR (SELECT auth.role()) = 'service_role'
  OR (SELECT get_current_user_role()) = 'admin'
  OR (
    (SELECT get_current_user_role()) = 'player_manager'
    AND team_id = ANY (get_current_user_team_ids())
  )
)
WITH CHECK (
  pg_trigger_depth() > 0
  OR (SELECT auth.role()) = 'service_role'
  OR (SELECT get_current_user_role()) = 'admin'
  OR (
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
  )
);

-- ── teams: merged SELECT ──
DROP POLICY IF EXISTS "Admins can read teams" ON public.teams;
DROP POLICY IF EXISTS "Only admins can read all team data" ON public.teams;
DROP POLICY IF EXISTS "Referees can read team names" ON public.teams;
DROP POLICY IF EXISTS "Team managers can read teams" ON public.teams;
DROP POLICY IF EXISTS "Team managers can read all teams when enabled" ON public.teams;
DROP POLICY IF EXISTS "Team managers can read their own team data" ON public.teams;

CREATE POLICY "Read teams by role"
ON public.teams
FOR SELECT
TO public
USING (
  (SELECT get_current_user_role()) = 'admin'
  OR (SELECT get_current_user_role()) = 'referee'
  OR (SELECT get_current_user_role()) = 'player_manager'
);

-- ── team_users: merged SELECT ──
DROP POLICY IF EXISTS "Admins can select team_users" ON public.team_users;
DROP POLICY IF EXISTS "Team managers can read their own team relations" ON public.team_users;

CREATE POLICY "Read team_users by role"
ON public.team_users
FOR SELECT
TO public
USING (
  (SELECT get_current_user_role()) = 'admin'
  OR (
    (SELECT get_current_user_role()) = 'player_manager'
    AND user_id = (SELECT current_setting('app.current_user_id', true))::integer
  )
);

-- ── users: admin write policies; SELECT merged above ──
DROP POLICY IF EXISTS "Only admins can manage users" ON public.users;

CREATE POLICY "Manage users as admin"
ON public.users
FOR INSERT
TO public
WITH CHECK ((SELECT get_current_user_role()) = 'admin');

CREATE POLICY "Update users as admin"
ON public.users
FOR UPDATE
TO public
USING ((SELECT get_current_user_role()) = 'admin')
WITH CHECK ((SELECT get_current_user_role()) = 'admin');

CREATE POLICY "Delete users as admin"
ON public.users
FOR DELETE
TO public
USING ((SELECT get_current_user_role()) = 'admin');

-- ── application_settings: admin ALL overlaps merged SELECT — split writes ──
DROP POLICY IF EXISTS "Admins can manage all application settings" ON public.application_settings;

CREATE POLICY "Write application settings as admin"
ON public.application_settings
FOR INSERT
TO public
WITH CHECK ((SELECT is_admin_user()));

CREATE POLICY "Update application settings as admin"
ON public.application_settings
FOR UPDATE
TO public
USING ((SELECT is_admin_user()))
WITH CHECK ((SELECT is_admin_user()));

CREATE POLICY "Delete application settings as admin"
ON public.application_settings
FOR DELETE
TO public
USING ((SELECT is_admin_user()));
