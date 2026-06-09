-- Lichtgewicht fingerprint voor financiële pagina: detecteer wijzigingen zonder volledige transactielijst.

CREATE OR REPLACE FUNCTION public.get_team_costs_revision_for_session(
  p_session_token uuid
)
RETURNS TABLE(row_count bigint, max_id bigint, amount_sum numeric)
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
  SELECT
    count(*)::bigint,
    coalesce(max(tc.id), 0)::bigint,
    coalesce(sum(tc.amount), 0)::numeric
  FROM public.team_costs tc;
END;
$$;

REVOKE ALL ON FUNCTION public.get_team_costs_revision_for_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_costs_revision_for_session(uuid) TO anon, authenticated;
