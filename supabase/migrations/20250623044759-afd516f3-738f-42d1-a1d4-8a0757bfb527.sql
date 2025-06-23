
-- Convert all plain text passwords to bcrypt hashes and revert to simple verification
-- First, update all users with plain text passwords to bcrypt hashes
UPDATE public.users 
SET password = crypt('admin123', gen_salt('bf', 8))
WHERE username = 'admin';

UPDATE public.users 
SET password = crypt('temporary_password', gen_salt('bf', 8))
WHERE username = 'test123';

-- Revert to the original, simple verify_user_password function
CREATE OR REPLACE FUNCTION public.verify_user_password(input_username_or_email text, input_password text)
 RETURNS TABLE(user_id integer, username character varying, email character varying, role user_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT u.user_id, u.username, u.email, u.role
  FROM public.users u
  WHERE (u.username = input_username_or_email OR u.email = input_username_or_email)
    AND u.password = crypt(input_password, u.password);
END;
$function$;

-- Log the updated passwords for verification
DO $$
DECLARE
  user_rec record;
BEGIN
  FOR user_rec IN SELECT username, left(password, 10) as pwd_preview FROM public.users LOOP
    RAISE NOTICE 'User: % - Password preview: %', user_rec.username, user_rec.pwd_preview;
  END LOOP;
END $$;
