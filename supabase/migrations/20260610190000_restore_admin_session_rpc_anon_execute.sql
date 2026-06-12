-- Restore anon EXECUTE on admin session RPCs.
-- 20260609165419 revoked anon (granted authenticated only); 20260615000000 then
-- revoked authenticated on all public functions. Browser uses anon key + p_session_token.

GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_player_cards_for_admin(uuid) TO anon;
