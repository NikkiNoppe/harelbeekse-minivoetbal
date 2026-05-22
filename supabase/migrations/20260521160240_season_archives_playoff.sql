-- Playoff archive in season_archives (same pattern as competition/cup).

ALTER TABLE public.season_archives
  ADD COLUMN IF NOT EXISTS playoff jsonb;

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
  v_existing_playoff jsonb;
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

  SELECT sa.cup_winner, sa.playoff
  INTO v_existing_cup, v_existing_playoff
  FROM public.season_archives sa
  WHERE sa.season_label = p_season_label;

  INSERT INTO public.season_archives (
    season_label,
    competition_standings,
    cup_winner,
    playoff,
    archived_by
  )
  VALUES (
    p_season_label,
    p_competition_standings,
    v_existing_cup,
    v_existing_playoff,
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
  v_existing_playoff jsonb;
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

  SELECT sa.competition_standings, sa.playoff
  INTO v_existing_standings, v_existing_playoff
  FROM public.season_archives sa
  WHERE sa.season_label = p_season_label;

  INSERT INTO public.season_archives (
    season_label,
    competition_standings,
    cup_winner,
    playoff,
    archived_by
  )
  VALUES (
    p_season_label,
    v_existing_standings,
    p_cup_winner,
    v_existing_playoff,
    NULLIF(p_admin_user_id, -1)
  )
  ON CONFLICT (season_label)
  DO UPDATE SET
    cup_winner = EXCLUDED.cup_winner,
    archived_by = COALESCE(NULLIF(p_admin_user_id, -1), season_archives.archived_by),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_season_playoff(
  p_admin_user_id integer,
  p_season_label text,
  p_playoff jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_existing_standings jsonb;
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
    RAISE EXCEPTION 'Only admins can archive playoff results';
  END IF;

  SELECT sa.competition_standings, sa.cup_winner
  INTO v_existing_standings, v_existing_cup
  FROM public.season_archives sa
  WHERE sa.season_label = p_season_label;

  INSERT INTO public.season_archives (
    season_label,
    competition_standings,
    cup_winner,
    playoff,
    archived_by
  )
  VALUES (
    p_season_label,
    v_existing_standings,
    v_existing_cup,
    p_playoff,
    NULLIF(p_admin_user_id, -1)
  )
  ON CONFLICT (season_label)
  DO UPDATE SET
    playoff = EXCLUDED.playoff,
    archived_by = COALESCE(NULLIF(p_admin_user_id, -1), season_archives.archived_by),
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_season_playoff(integer, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_upsert_season_playoff(integer, text, jsonb)
  TO anon, authenticated, service_role;
