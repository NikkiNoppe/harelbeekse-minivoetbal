-- Teamverantwoordelijken mogen admin-notities en -aanpassingen lezen voor automatische schorsingen van eigen spelers
CREATE POLICY "Team managers can read automatic suspension overrides for their team"
ON public.application_settings
FOR SELECT
USING (
  (setting_category)::text = 'automatic_suspension_overrides'
  AND is_active = true
  AND get_current_user_role() = 'player_manager'
  AND (split_part((setting_name)::text, ':', 1))::integer IN (
    SELECT player_id FROM public.players
    WHERE team_id = ANY(get_current_user_team_ids())
  )
);
