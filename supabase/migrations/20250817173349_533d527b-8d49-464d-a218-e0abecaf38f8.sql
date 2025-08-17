-- Create set_config RPC function for setting session variables
CREATE OR REPLACE FUNCTION public.set_config(parameter text, value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config(parameter, value, false);
END;
$$;