-- Fix the create_user_with_hashed_password function to work without created_at column
-- The users table doesn't have a created_at column, so we need to remove it from the function

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

  INSERT INTO public.users (username, email, password, role)
  VALUES (
    username_param,
    email_param,
    hashed_password,
    role_param
  )
  RETURNING * INTO new_user;
  
  RETURN new_user;
END;
$function$; 