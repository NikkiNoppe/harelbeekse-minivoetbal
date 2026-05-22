CREATE OR REPLACE FUNCTION public.get_team_recipients(p_team_ids integer[])
RETURNS TABLE (
  team_id integer,
  team_name text,
  email text,
  username text,
  source text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT t.team_id,
         t.team_name::text,
         trim(t.contact_email)::text,
         COALESCE(NULLIF(trim(t.contact_person), ''), 'Team contact')::text AS username,
         'contact'::text AS source
  FROM public.teams t
  WHERE t.team_id = ANY(p_team_ids)
    AND t.contact_email IS NOT NULL
    AND length(trim(t.contact_email)) > 0;

  IF public.get_current_user_role() = 'admin' THEN
    RETURN QUERY
    SELECT t.team_id,
           t.team_name::text,
           trim(u.email)::text,
           u.username::text,
           'manager'::text AS source
    FROM public.team_users tu
    JOIN public.teams t ON t.team_id = tu.team_id
    JOIN public.users u ON u.user_id = tu.user_id
    WHERE tu.team_id = ANY(p_team_ids)
      AND u.email IS NOT NULL
      AND length(trim(u.email)) > 0;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_recipients(integer[]) TO anon, authenticated, service_role;