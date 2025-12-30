-- Team managers kunnen manual suspensions lezen voor spelers van hun eigen team
CREATE POLICY "Team managers can read their team suspensions"
ON public.application_settings
FOR SELECT
USING (
  (setting_category)::text = 'manual_suspensions'
  AND is_active = true
  AND get_current_user_role() = 'player_manager'
  AND (setting_name)::integer IN (
    SELECT player_id FROM public.players 
    WHERE team_id = ANY(get_current_user_team_ids())
  )
);

-- Team managers kunnen suspension rules lezen (voor UI weergave)
CREATE POLICY "Team managers can read suspension rules"
ON public.application_settings
FOR SELECT
USING (
  (setting_category)::text = 'suspension_rules'
  AND is_active = true
  AND get_current_user_role() = 'player_manager'
);