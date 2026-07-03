-- SuperAdmin en team-CRUD: altijd scopen op actieve organization_id (acting org).

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

  IF v_role = 'admin' THEN
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

CREATE OR REPLACE FUNCTION public.insert_team_for_session(
  p_session_token uuid,
  p_team_data jsonb
)
RETURNS TABLE(team_id integer, success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_org_id integer;
  v_new_id integer;
BEGIN
  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN QUERY SELECT NULL::integer, false, 'Alleen admins'::text;
    RETURN;
  END IF;

  INSERT INTO public.teams (
    organization_id,
    team_name,
    contact_person,
    contact_phone,
    contact_email,
    club_colors,
    preferred_play_moments
  )
  VALUES (
    v_org_id,
    (p_team_data->>'team_name')::varchar,
    NULLIF(p_team_data->>'contact_person', ''),
    NULLIF(p_team_data->>'contact_phone', ''),
    NULLIF(p_team_data->>'contact_email', ''),
    NULLIF(p_team_data->>'club_colors', ''),
    CASE WHEN p_team_data ? 'preferred_play_moments' THEN p_team_data->'preferred_play_moments' ELSE NULL END
  )
  RETURNING public.teams.team_id INTO v_new_id;

  RETURN QUERY SELECT v_new_id, true, 'Team toegevoegd'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_team_for_session(
  p_session_token uuid,
  p_team_id integer,
  p_team_data jsonb
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_org_id integer;
BEGIN
  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN QUERY SELECT false, 'Alleen admins'::text;
    RETURN;
  END IF;

  UPDATE public.teams SET
    team_name = COALESCE((p_team_data->>'team_name')::varchar, team_name),
    contact_person = CASE WHEN p_team_data ? 'contact_person' THEN NULLIF(p_team_data->>'contact_person', '') ELSE contact_person END,
    contact_phone = CASE WHEN p_team_data ? 'contact_phone' THEN NULLIF(p_team_data->>'contact_phone', '') ELSE contact_phone END,
    contact_email = CASE WHEN p_team_data ? 'contact_email' THEN NULLIF(p_team_data->>'contact_email', '') ELSE contact_email END,
    club_colors = CASE WHEN p_team_data ? 'club_colors' THEN NULLIF(p_team_data->>'club_colors', '') ELSE club_colors END,
    preferred_play_moments = CASE WHEN p_team_data ? 'preferred_play_moments' THEN p_team_data->'preferred_play_moments' ELSE preferred_play_moments END
  WHERE team_id = p_team_id
    AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Team niet gevonden'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Team bijgewerkt'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_team_for_session(
  p_session_token uuid,
  p_team_id integer
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_org_id integer;
BEGIN
  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN QUERY SELECT false, 'Alleen admins'::text;
    RETURN;
  END IF;

  DELETE FROM public.teams
  WHERE team_id = p_team_id
    AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Team niet gevonden'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Team verwijderd'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.get_teams_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_teams_for_session(uuid, integer) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.insert_team_for_session(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_team_for_session(uuid, integer, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_team_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_team_for_session(uuid, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_team_for_session(uuid, integer, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_team_for_session(uuid, integer) TO anon, authenticated;

COMMENT ON FUNCTION public.get_teams_for_session(uuid, integer) IS
  'Admin: teams van actieve tenant (SuperAdmin via acting_organization_id). Team manager: eigen ploegen binnen tenant.';
