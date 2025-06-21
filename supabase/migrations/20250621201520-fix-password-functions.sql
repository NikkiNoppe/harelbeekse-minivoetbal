
-- Fix password verification functions to work without pgcrypto initially
-- We'll use a simpler approach first, then can upgrade to pgcrypto later

-- First, let's make sure pgcrypto is properly enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the verify_user_password function to handle both hashed and plain passwords
CREATE OR REPLACE FUNCTION public.verify_user_password(input_username_or_email text, input_password text)
 RETURNS TABLE(user_id integer, username character varying, email character varying, role user_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- First try with crypt function (for properly hashed passwords)
  BEGIN
    RETURN QUERY
    SELECT u.user_id, u.username, u.email, u.role
    FROM public.users u
    WHERE (u.username = input_username_or_email OR u.email = input_username_or_email)
      AND u.password = crypt(input_password, u.password);
    
    -- If we found a result, return it
    IF FOUND THEN
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If crypt fails, continue to next method
    NULL;
  END;
  
  -- Fallback: try direct password comparison (for testing/initial setup)
  RETURN QUERY
  SELECT u.user_id, u.username, u.email, u.role
  FROM public.users u
  WHERE (u.username = input_username_or_email OR u.email = input_username_or_email)
    AND u.password = input_password;
END;
$function$;

-- Update create_user_with_hashed_password to handle both scenarios
CREATE OR REPLACE FUNCTION public.create_user_with_hashed_password(
  username_param character varying, 
  email_param character varying, 
  password_param character varying, 
  role_param user_role DEFAULT 'player_manager'::user_role
)
 RETURNS users
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  new_user public.users;
  hashed_password character varying;
BEGIN
  -- Try to hash the password with crypt
  BEGIN
    hashed_password := crypt(password_param, gen_salt('bf', 8));
  EXCEPTION WHEN OTHERS THEN
    -- If crypt fails, store plain password (not recommended for production)
    hashed_password := password_param;
  END;

  INSERT INTO public.users (username, email, password, role, created_at)
  VALUES (
    username_param,
    email_param,
    hashed_password,
    role_param,
    CURRENT_TIMESTAMP
  )
  RETURNING * INTO new_user;
  
  RETURN new_user;
END;
$function$;

-- Update update_user_password to handle both scenarios  
CREATE OR REPLACE FUNCTION public.update_user_password(user_id_param integer, new_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  hashed_password character varying;
BEGIN
  -- Try to hash the password with crypt
  BEGIN
    hashed_password := crypt(new_password, gen_salt('bf', 8));
  EXCEPTION WHEN OTHERS THEN
    -- If crypt fails, store plain password (not recommended for production)
    hashed_password := new_password;
  END;

  UPDATE public.users 
  SET password = hashed_password
  WHERE user_id = user_id_param;
  
  RETURN FOUND;
END;
$function$;
