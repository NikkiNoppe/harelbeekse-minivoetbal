-- Scanner hardening: password_reset_tokens, user_sessions, GraphQL surface.
-- Session-RPC GRANT EXECUTE warnings remain intentional (auth inside function bodies).

-- =============================================================================
-- 1) password_reset_tokens — no direct client access (service_role + SECURITY DEFINER RPCs only)
-- =============================================================================
DROP POLICY IF EXISTS "Anon can create reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Anon can read reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Anon can update reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Service role can manage reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Anon can create reset token entries" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Anon can update reset tokens for validation" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "System can create reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "System can validate reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "System can update reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Admins can delete expired tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Deny client read on password reset tokens" ON public.password_reset_tokens;

CREATE POLICY "Deny all client access on password reset tokens"
ON public.password_reset_tokens
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

REVOKE ALL ON TABLE public.password_reset_tokens FROM anon, authenticated;
GRANT ALL ON TABLE public.password_reset_tokens TO service_role;

COMMENT ON TABLE public.password_reset_tokens IS
  'Password reset hashes. No client table access — edge functions (service_role) and reset_password_with_token RPC only.';

-- =============================================================================
-- 2) user_sessions — explicit deny (RLS enabled, no permissive policies)
-- =============================================================================
DROP POLICY IF EXISTS "Deny all client access on user sessions" ON public.user_sessions;

CREATE POLICY "Deny all client access on user sessions"
ON public.user_sessions
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

REVOKE ALL ON TABLE public.user_sessions FROM anon, authenticated;
GRANT ALL ON TABLE public.user_sessions TO service_role;
