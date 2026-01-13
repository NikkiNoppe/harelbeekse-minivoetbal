-- Allow referees to add penalties for matches they referee
-- This enables referees to add fines/penalties during match form submission

CREATE POLICY "Referees can add penalties for their matches"
ON public.team_costs
FOR INSERT
TO public
WITH CHECK (
  -- User must be a referee
  (get_current_user_role() = 'referee') 
  -- Penalty must be linked to a match
  AND match_id IS NOT NULL
  -- Referee must be assigned to this match (either by assigned_referee_id or referee username)
  AND EXISTS (
    SELECT 1 FROM matches m
    JOIN users u ON u.user_id = (current_setting('app.current_user_id', true))::integer
    WHERE m.match_id = team_costs.match_id
    AND (m.assigned_referee_id = u.user_id OR m.referee = u.username)
  )
);