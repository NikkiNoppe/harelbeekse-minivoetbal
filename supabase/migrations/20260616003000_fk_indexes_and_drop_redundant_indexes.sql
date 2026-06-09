-- Lint 0001: index foreign keys used in RLS, joins and cascades.
-- Lint 0005: drop redundant/unused indexes (keep idx_referee_matches_poll — poll RPCs filter on poll_month).

CREATE INDEX IF NOT EXISTS idx_matches_home_team_id ON public.matches (home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team_id ON public.matches (away_team_id);
CREATE INDEX IF NOT EXISTS idx_team_costs_team_id ON public.team_costs (team_id);
CREATE INDEX IF NOT EXISTS idx_team_costs_cost_setting_id ON public.team_costs (cost_setting_id);

-- Duplicate of password_reset_tokens_token_key (UNIQUE on token)
DROP INDEX IF EXISTS public.idx_password_reset_tokens_token;

-- Duplicate of users_username_key (UNIQUE on username)
DROP INDEX IF EXISTS public.idx_users_username;

-- Unused composites / low-cardinality filters (login uses username unique index; app reads via session RPCs)
DROP INDEX IF EXISTS public.idx_users_username_email;
DROP INDEX IF EXISTS public.idx_users_role;

-- Poll filters run on referee_matches.poll_month / match_date, not matches.poll_* columns
DROP INDEX IF EXISTS public.idx_matches_poll_group;
DROP INDEX IF EXISTS public.idx_matches_poll_month;

-- idx_referee_matches_poll: intentionally kept (admin/scheids RPCs: WHERE rm.poll_month = …)

COMMENT ON INDEX public.idx_matches_home_team_id IS 'FK matches_home_team_id_fkey; team-scoped RLS and schedule queries.';
COMMENT ON INDEX public.idx_matches_away_team_id IS 'FK matches_away_team_id_fkey; team-scoped RLS and schedule queries.';
COMMENT ON INDEX public.idx_team_costs_team_id IS 'FK team_costs_team_id_fkey; financial reads by team.';
COMMENT ON INDEX public.idx_team_costs_cost_setting_id IS 'FK team_costs_cost_setting_id_fkey; cost sync and penalty lookups.';
