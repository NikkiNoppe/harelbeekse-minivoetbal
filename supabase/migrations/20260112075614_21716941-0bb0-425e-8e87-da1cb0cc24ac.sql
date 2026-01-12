-- Team managers kunnen hun eigen team wedstrijden updaten
CREATE POLICY "Team managers can update their team matches"
ON public.matches
FOR UPDATE
TO authenticated
USING (
  get_current_user_role() = 'player_manager' 
  AND (
    home_team_id = ANY(get_current_user_team_ids())
    OR away_team_id = ANY(get_current_user_team_ids())
  )
)
WITH CHECK (
  get_current_user_role() = 'player_manager'
  AND (
    home_team_id = ANY(get_current_user_team_ids())
    OR away_team_id = ANY(get_current_user_team_ids())
  )
);