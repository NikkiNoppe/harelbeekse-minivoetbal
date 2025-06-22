
-- Create a simple password verification function without crypt dependency
-- This will help us debug and get login working immediately

-- Create a simple verification function that only does plain text comparison
CREATE OR REPLACE FUNCTION public.verify_user_password_simple(input_username_or_email text, input_password text)
 RETURNS TABLE(user_id integer, username character varying, email character varying, role user_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Log the input for debugging
  RAISE NOTICE 'verify_user_password_simple called with username/email: %', input_username_or_email;
  RAISE NOTICE 'verify_user_password_simple called with password length: %', length(input_password);
  
  -- Simple direct password comparison
  RETURN QUERY
  SELECT u.user_id, u.username, u.email, u.role
  FROM public.users u
  WHERE (u.username = input_username_or_email OR u.email = input_username_or_email)
    AND u.password = input_password;
  
  -- Log if we found a user
  IF FOUND THEN
    RAISE NOTICE 'User found and password matched for: %', input_username_or_email;
  ELSE
    RAISE NOTICE 'No user found or password mismatch for: %', input_username_or_email;
  END IF;
END;
$function$;

-- Also create a function to check what users exist (for debugging)
CREATE OR REPLACE FUNCTION public.debug_list_users()
 RETURNS TABLE(user_id integer, username character varying, email character varying, role user_role, password_length integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT u.user_id, u.username, u.email, u.role, length(u.password) as password_length
  FROM public.users u
  ORDER BY u.username;
END;
$function$;
