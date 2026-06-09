-- Kostentarieven lezen via sessie-RPC (directe costs-tabel is geen anon-read meer).

CREATE OR REPLACE FUNCTION public.get_costs_for_session(
  p_session_token uuid,
  p_category text DEFAULT NULL
)
RETURNS TABLE(
  id integer,
  name text,
  amount numeric,
  category text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  SELECT r.role INTO v_role
  FROM public.resolve_session_for_costs(p_session_token) r
  LIMIT 1;

  IF v_role IS NULL OR v_role = '' OR v_role <> 'admin' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT c.id, c.name::text, c.amount, c.category::text
  FROM public.costs c
  WHERE p_category IS NULL OR c.category::text = p_category
  ORDER BY c.category, c.name;
END;
$$;

REVOKE ALL ON FUNCTION public.get_costs_for_session(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_costs_for_session(uuid, text) TO anon, authenticated;
