-- Final Security Fixes - Remove Anonymous Write Access and Fix Remaining Issues

-- Remove all anonymous write access from critical tables
DROP POLICY IF EXISTS "matches_anon_write_final" ON public.matches;
DROP POLICY IF EXISTS "matches_authenticated_write_final" ON public.matches;
DROP POLICY IF EXISTS "matches_unified_policy" ON public.matches;

-- Create proper matches policies (admin and authenticated only)
CREATE POLICY "Only admins can manage matches" 
ON public.matches 
FOR ALL 
USING (get_current_user_role() = 'admin'::text)
WITH CHECK (get_current_user_role() = 'admin'::text);

CREATE POLICY "Authenticated users can read matches" 
ON public.matches 
FOR SELECT 
TO authenticated
USING (true);

-- Remove anonymous write access from costs table
DROP POLICY IF EXISTS "costs_anon_write_final" ON public.costs;
DROP POLICY IF EXISTS "costs_authenticated_write_final" ON public.costs;
DROP POLICY IF EXISTS "costs_unified_policy" ON public.costs;

-- Create proper costs policies
CREATE POLICY "Only admins can manage costs" 
ON public.costs 
FOR ALL 
USING (get_current_user_role() = 'admin'::text)
WITH CHECK (get_current_user_role() = 'admin'::text);

CREATE POLICY "Authenticated users can read costs" 
ON public.costs 
FOR SELECT 
TO authenticated
USING (true);

-- Remove anonymous write access from team_costs table
DROP POLICY IF EXISTS "team_costs_anon_write_final" ON public.team_costs;
DROP POLICY IF EXISTS "team_costs_authenticated_write_final" ON public.team_costs;
DROP POLICY IF EXISTS "team_costs_unified_policy" ON public.team_costs;

-- Create proper team_costs policies
CREATE POLICY "Only admins can manage team costs" 
ON public.team_costs 
FOR ALL 
USING (get_current_user_role() = 'admin'::text)
WITH CHECK (get_current_user_role() = 'admin'::text);

CREATE POLICY "Authenticated users can read team costs" 
ON public.team_costs 
FOR SELECT 
TO authenticated
USING (true);

-- Remove anonymous write access from application_settings
DROP POLICY IF EXISTS "application_settings_anon_write" ON public.application_settings;
DROP POLICY IF EXISTS "application_settings_unified_policy" ON public.application_settings;

-- Create proper application_settings policies (keep existing read policies)
CREATE POLICY "Only admins can manage application settings" 
ON public.application_settings 
FOR INSERT, UPDATE, DELETE
USING (get_current_user_role() = 'admin'::text)
WITH CHECK (get_current_user_role() = 'admin'::text);

-- Remove anonymous read access from competition_standings  
DROP POLICY IF EXISTS "competition_standings_unified_policy" ON public.competition_standings;

-- Create proper competition_standings policies
CREATE POLICY "Only admins can manage competition standings" 
ON public.competition_standings 
FOR ALL 
USING (get_current_user_role() = 'admin'::text)
WITH CHECK (get_current_user_role() = 'admin'::text);

CREATE POLICY "Public can read competition standings" 
ON public.competition_standings 
FOR SELECT 
USING (true);

-- Fix views to be more secure (remove SECURITY DEFINER if present)
DROP VIEW IF EXISTS public.teams_public;
DROP VIEW IF EXISTS public.players_public;

-- Create non-security definer views
CREATE VIEW public.teams_public AS
SELECT team_id, team_name
FROM public.teams;

CREATE VIEW public.players_public AS
SELECT 
    player_id,
    team_id,
    first_name,
    last_name,
    yellow_cards,
    red_cards,
    suspended_matches_remaining
FROM public.players;

-- Grant appropriate access to views
GRANT SELECT ON public.teams_public TO anon, authenticated;
GRANT SELECT ON public.players_public TO anon, authenticated;

-- Ensure RLS is enabled on all sensitive tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_standings ENABLE ROW LEVEL SECURITY;