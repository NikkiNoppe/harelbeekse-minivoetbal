-- Scheidsrechters: alle teams van de actieve tenant (volledige gegevens via session-RPC).

CREATE OR REPLACE FUNCTION public.get_teams_for_session(
  p_session_token uuid,
  p_team_id integer DEFAULT NULL
)
RETURNS TABLE(
  team_id integer,
  team_name text,
  contact_person text,
  contact_phone text,
  contact_email text,
  club_colors text,
  preferred_play_moments jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_org_id integer;
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  SELECT s.user_id, s.role, s.team_ids, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  IF v_role IN ('admin', 'referee') THEN
    RETURN QUERY
    SELECT
      t.team_id,
      t.team_name::text,
      t.contact_person::text,
      t.contact_phone::text,
      t.contact_email::text,
      t.club_colors::text,
      t.preferred_play_moments
    FROM public.teams t
    WHERE t.organization_id = v_org_id
      AND (p_team_id IS NULL OR t.team_id = p_team_id)
    ORDER BY t.team_name::text;
    RETURN;
  END IF;

  IF v_role = 'player_manager' THEN
    IF v_team_ids IS NULL OR array_length(v_team_ids, 1) IS NULL THEN
      RETURN;
    END IF;

    RETURN QUERY
    SELECT
      t.team_id,
      t.team_name::text,
      t.contact_person::text,
      t.contact_phone::text,
      t.contact_email::text,
      t.club_colors::text,
      t.preferred_play_moments
    FROM public.teams t
    WHERE t.team_id = ANY(v_team_ids)
      AND t.organization_id = v_org_id
      AND (p_team_id IS NULL OR t.team_id = p_team_id)
    ORDER BY t.team_name::text;
    RETURN;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_teams_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_teams_for_session(uuid, integer) TO anon, authenticated;

COMMENT ON FUNCTION public.get_teams_for_session(uuid, integer) IS
  'Admin en scheids: alle teams + contact van actieve tenant. Team manager: eigen ploegen.';
