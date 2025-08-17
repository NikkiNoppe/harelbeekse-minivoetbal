-- Create password reset tokens table
CREATE TABLE public.password_reset_tokens (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id INTEGER NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  requested_email VARCHAR(255) NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for token access (anyone can validate tokens)
CREATE POLICY "Anyone can validate password reset tokens" 
ON public.password_reset_tokens 
FOR SELECT 
USING (true);

-- Create policy for token creation (anyone can create tokens)
CREATE POLICY "Anyone can create password reset tokens" 
ON public.password_reset_tokens 
FOR INSERT 
WITH CHECK (true);

-- Create policy for token updates (anyone can mark as used)
CREATE POLICY "Anyone can update password reset tokens" 
ON public.password_reset_tokens 
FOR UPDATE 
USING (true);

-- Create index for better performance
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);

-- Add RPC function to validate and use reset token
CREATE OR REPLACE FUNCTION public.reset_password_with_token(
  p_token TEXT,
  p_new_password TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id INTEGER;
  v_token_record RECORD;
BEGIN
  -- Get token record
  SELECT user_id, expires_at, used_at, requested_email
  INTO v_token_record
  FROM public.password_reset_tokens
  WHERE token = p_token;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid token');
  END IF;
  
  -- Check if token is already used
  IF v_token_record.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token already used');
  END IF;
  
  -- Check if token is expired
  IF v_token_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token expired');
  END IF;
  
  -- Update user password
  UPDATE public.users 
  SET password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 8))
  WHERE user_id = v_token_record.user_id;
  
  -- Mark token as used
  UPDATE public.password_reset_tokens 
  SET used_at = NOW()
  WHERE token = p_token;
  
  RETURN jsonb_build_object('success', true, 'message', 'Password updated successfully');
END;
$$;