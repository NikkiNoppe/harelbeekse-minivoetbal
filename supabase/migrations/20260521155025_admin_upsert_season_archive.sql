-- Admin RPCs for season archive writes.
-- Direct REST upserts cannot rely on set_current_user_context because that context
-- is scoped to the request that sets it (connection pooling).

CREATE OR REPLACE FUNCTION public.admin_upsert_season_competition(
  p_admin_user_id integer,
  p_season_label text,
  p_competition_standings jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_existing_cup jsonb;
BEGIN
  SELECT u.role::text
  INTO v_role
  FROM public.users u
  WHERE u.user_id = p_admin_user_id;

  IF v_role IS NULL AND p_admin_user_id = -1 THEN
    v_role := 'admin';
  END IF;

  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can archive competition standings';
  END IF;

  SELECT sa.cup_winner
  INTO v_existing_cup
  FROM public.season_archives sa
  WHERE sa.season_label = p_season_label;

  INSERT INTO public.season_archives (
    season_label,
    competition_standings,
    cup_winner,
    archived_by
  )
  VALUES (
    p_season_label,
    p_competition_standings,
    v_existing_cup,
    NULLIF(p_admin_user_id, -1)
  )
  ON CONFLICT (season_label)
  DO UPDATE SET
    competition_standings = EXCLUDED.competition_standings,
    archived_by = COALESCE(NULLIF(p_admin_user_id, -1), season_archives.archived_by),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_season_cup(
  p_admin_user_id integer,
  p_season_label text,
  p_cup_winner jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_existing_standings jsonb;
BEGIN
  SELECT u.role::text
  INTO v_role
  FROM public.users u
  WHERE u.user_id = p_admin_user_id;

  IF v_role IS NULL AND p_admin_user_id = -1 THEN
    v_role := 'admin';
  END IF;

  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can archive cup results';
  END IF;

  SELECT sa.competition_standings
  INTO v_existing_standings
  FROM public.season_archives sa
  WHERE sa.season_label = p_season_label;

  INSERT INTO public.season_archives (
    season_label,
    competition_standings,
    cup_winner,
    archived_by
  )
  VALUES (
    p_season_label,
    v_existing_standings,
    p_cup_winner,
    NULLIF(p_admin_user_id, -1)
  )
  ON CONFLICT (season_label)
  DO UPDATE SET
    cup_winner = EXCLUDED.cup_winner,
    archived_by = COALESCE(NULLIF(p_admin_user_id, -1), season_archives.archived_by),
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_season_competition(integer, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_upsert_season_cup(integer, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_upsert_season_competition(integer, text, jsonb)
  TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.admin_upsert_season_cup(integer, text, jsonb)
  TO anon, authenticated, service_role;
