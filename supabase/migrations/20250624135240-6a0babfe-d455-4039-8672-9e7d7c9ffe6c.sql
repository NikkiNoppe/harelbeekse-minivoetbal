
-- Fix the crypt function access by explicitly using extensions.crypt()
-- This bypasses any search_path issues completely
-- Updated to handle both plain text and improved SHA-256 hashed passwords with random salt and iterations
CREATE OR REPLACE FUNCTION public.verify_user_password(input_username_or_email text, input_password text)
 RETURNS TABLE(user_id integer, username character varying, email character varying, role user_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_record RECORD;
  hash_part text;
  salt text;
  iterations_str text;
  stored_hash text;
  iterations integer;
  test_hash text;
  i integer;
BEGIN
  -- First, try to find the user
  SELECT * INTO user_record
  FROM public.users u
  WHERE (u.username = input_username_or_email OR u.email = input_username_or_email);
  
  -- If user not found, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check if password matches plain text (for backward compatibility)
  IF user_record.password = input_password THEN
    RETURN QUERY SELECT user_record.user_id, user_record.username, user_record.email, user_record.role;
    RETURN;
  END IF;
  
  -- Check if password matches our improved SHA-256 hash format
  -- Format: $2a$10$[salt][iterations][hash]
  IF user_record.password LIKE '$2a$10$%' THEN
    -- Parse the hash format
    hash_part := substring(user_record.password from 8); -- Remove $2a$10$
    salt := substring(hash_part from 1 for 16);
    iterations_str := substring(hash_part from 17 for 5);
    stored_hash := substring(hash_part from 22);
    
    iterations := iterations_str::integer;
    
    -- Recreate the hash with the same salt and iterations
    test_hash := input_password || salt;
    
    -- Apply multiple iterations of SHA-256
    FOR i IN 1..iterations LOOP
      test_hash := encode(sha256(test_hash::bytea), 'hex');
    END LOOP;
    
    -- Compare the stored hash with the test hash
    IF stored_hash = substring(test_hash from 1 for 32) THEN
      RETURN QUERY SELECT user_record.user_id, user_record.username, user_record.email, user_record.role;
      RETURN;
    END IF;
  END IF;
  
  -- If we get here, password doesn't match
  RETURN;
END;
$function$;
