-- Allow authenticated users to read admin messages
CREATE POLICY "Authenticated users can read admin messages"
ON public.application_settings
FOR SELECT
USING (
  (setting_category)::text = 'admin_messages'
  AND is_active = true
  AND get_current_user_role() IN ('admin', 'player_manager', 'referee')
);