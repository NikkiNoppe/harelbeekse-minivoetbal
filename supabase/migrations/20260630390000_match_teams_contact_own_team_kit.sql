-- Team manager: eigen team club_colors in wedstrijdformulier (contact blijft tegenstander-only).

CREATE OR REPLACE FUNCTION public.get_match_teams_contact_for_session(
  p_session_token uuid,
  p_home_team_id integer,
  p_away_team_id integer
)
RETURNS TABLE(
  team_id integer,
  team_name text,
  contact_person text,
  contact_phone text,
  contact_email text,
  club_colors text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_team_ids integer[];
  v_org_id integer;
  v_home_in_org boolean;
  v_away_in_org boolean;
BEGIN
  IF p_session_token IS NULL OR p_home_team_id IS NULL OR p_away_team_id IS NULL THEN
    RETURN;
  END IF;

  SELECT s.role, s.team_ids, s.organization_id
  INTO v_role, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.team_id = p_home_team_id AND t.organization_id = v_org_id
  ) INTO v_home_in_org;

  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.team_id = p_away_team_id AND t.organization_id = v_org_id
  ) INTO v_away_in_org;

  IF NOT v_home_in_org OR NOT v_away_in_org THEN
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
      t.club_colors::text
    FROM public.teams t
    WHERE t.organization_id = v_org_id
      AND t.team_id IN (p_home_team_id, p_away_team_id)
    ORDER BY CASE WHEN t.team_id = p_home_team_id THEN 0 ELSE 1 END;
    RETURN;
  END IF;

  IF v_role = 'player_manager' THEN
    IF v_team_ids IS NULL OR array_length(v_team_ids, 1) IS NULL THEN
      RETURN;
    END IF;

    IF NOT (p_home_team_id = ANY(v_team_ids) OR p_away_team_id = ANY(v_team_ids)) THEN
      RETURN;
    END IF;

    RETURN QUERY
    SELECT
      t.team_id,
      t.team_name::text,
      CASE
        WHEN t.team_id = ANY(v_team_ids) THEN NULL
        ELSE t.contact_person
      END::text,
      CASE
        WHEN t.team_id = ANY(v_team_ids) THEN NULL
        ELSE t.contact_phone
      END::text,
      CASE
        WHEN t.team_id = ANY(v_team_ids) THEN NULL
        ELSE t.contact_email
      END::text,
      t.club_colors::text
    FROM public.teams t
    WHERE t.organization_id = v_org_id
      AND t.team_id IN (p_home_team_id, p_away_team_id)
    ORDER BY
      CASE WHEN t.team_id = ANY(v_team_ids) THEN 1 ELSE 0 END,
      t.team_name::text;
    RETURN;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_match_teams_contact_for_session(uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_match_teams_contact_for_session(uuid, integer, integer) TO anon, authenticated;

COMMENT ON FUNCTION public.get_match_teams_contact_for_session(uuid, integer, integer) IS
  'Wedstrijdformulier: admin/scheids beide teams; team manager tegenstander-contact + eigen club_colors.';
