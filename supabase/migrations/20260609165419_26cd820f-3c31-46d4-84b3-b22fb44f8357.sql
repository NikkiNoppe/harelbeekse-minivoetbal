REVOKE EXECUTE ON FUNCTION public.get_all_users_for_admin(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_player_cards_for_admin(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_player_cards_for_admin(uuid) TO authenticated, service_role;