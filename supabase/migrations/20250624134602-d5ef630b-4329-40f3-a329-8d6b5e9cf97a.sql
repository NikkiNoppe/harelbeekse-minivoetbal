
-- Fix the search_path issue for the verify_user_password function
-- The crypt function exists but is not accessible due to search_path restrictions
CREATE OR REPLACE FUNCTION public.verify_user_password(input_username_or_email text, input_password text)
 RETURNS TABLE(user_id integer, username character varying, email character varying, role user_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public, extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT u.user_id, u.username, u.email, u.role
  FROM public.users u
  WHERE (u.username = input_username_or_email OR u.email = input_username_or_email)
    AND u.password = crypt(input_password, u.password);
END;
$function$;
