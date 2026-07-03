-- Re-apply anon EXECUTE after 20260609165419 was replayed on remote without re-running
-- 20260610190000_restore_admin_session_rpc_anon_execute (already marked applied).
-- Browser calls these RPCs with anon key + p_session_token.

GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_player_cards_for_admin(uuid) TO anon;
