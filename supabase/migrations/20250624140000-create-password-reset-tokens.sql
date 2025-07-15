-- Create password reset tokens table for secure password reset functionality
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  requested_email VARCHAR(255) NOT NULL -- Store the email that was used in the request
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Add RLS policies
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access this table
CREATE POLICY "Service role can manage password reset tokens" ON public.password_reset_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up expired tokens (can be called by a cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_reset_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < NOW() OR used_at IS NOT NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Function to validate a password reset token
CREATE OR REPLACE FUNCTION public.validate_password_reset_token(token_param VARCHAR(255))
RETURNS TABLE(user_id INTEGER, username VARCHAR, email VARCHAR, is_valid BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Find the token
  SELECT prt.user_id, prt.token, prt.expires_at, prt.used_at, u.username, u.email
  INTO token_record
  FROM public.password_reset_tokens prt
  JOIN public.users u ON u.user_id = prt.user_id
  WHERE prt.token = token_param;
  
  -- Check if token exists and is valid
  IF token_record IS NULL THEN
    RETURN QUERY SELECT NULL::INTEGER, NULL::VARCHAR, NULL::VARCHAR, FALSE;
    RETURN;
  END IF;
  
  -- Check if token is expired or already used
  IF token_record.expires_at < NOW() OR token_record.used_at IS NOT NULL THEN
    RETURN QUERY SELECT token_record.user_id, token_record.username, token_record.email, FALSE;
    RETURN;
  END IF;
  
  -- Token is valid
  RETURN QUERY SELECT token_record.user_id, token_record.username, token_record.email, TRUE;
END;
$$;

-- Function to mark a token as used
CREATE OR REPLACE FUNCTION public.mark_password_reset_token_used(token_param VARCHAR(255))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.password_reset_tokens 
  SET used_at = NOW()
  WHERE token = token_param;
  
  RETURN FOUND;
END;
$$; 