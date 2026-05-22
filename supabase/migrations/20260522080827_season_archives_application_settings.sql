-- Season archives via application_settings (geen aparte tabel).
-- Admin schrijft via SECURITY DEFINER RPC; iedereen kan lezen.

CREATE POLICY "Public can read season archives"
ON public.application_settings
FOR SELECT
USING (
  setting_category = 'season_archives'
  AND is_active = true
);

CREATE OR REPLACE FUNCTION public.upsert_season_archive(
  p_user_id integer,
  p_season_label text,
  p_field text,
  p_value jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_existing jsonb;
  v_merged jsonb;
  v_row_id integer;
BEGIN
  IF p_season_label IS NULL OR trim(p_season_label) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seizoenlabel ontbreekt');
  END IF;

  IF p_field NOT IN ('competition_standings', 'cup_winner', 'playoff') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldig archiefveld');
  END IF;

  SELECT role::text INTO v_role FROM public.users WHERE user_id = p_user_id;
  IF v_role IS NULL AND p_user_id = -1 THEN
    v_role := 'admin';
  END IF;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen archiveren');
  END IF;

  SELECT id, setting_value
  INTO v_row_id, v_existing
  FROM public.application_settings
  WHERE setting_category = 'season_archives'
    AND setting_name = p_season_label
  LIMIT 1;

  v_merged := COALESCE(v_existing, '{}'::jsonb) || jsonb_build_object(p_field, p_value);

  IF v_row_id IS NULL THEN
    INSERT INTO public.application_settings (
      setting_category,
      setting_name,
      setting_value,
      is_active,
      updated_at
    )
    VALUES (
      'season_archives',
      p_season_label,
      v_merged,
      true,
      now()
    );
  ELSE
    UPDATE public.application_settings
    SET setting_value = v_merged,
        updated_at = now(),
        is_active = true
    WHERE id = v_row_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Archief opgeslagen');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_season_archive(integer, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_season_archive(integer, text, text, jsonb)
  TO anon, authenticated, service_role;

-- Bestaande 2025-2026 data migreren (was hardcoded / in oude season_archives tabel)
INSERT INTO public.application_settings (
  setting_category,
  setting_name,
  setting_value,
  is_active,
  updated_at
)
SELECT
  'season_archives',
  '2025-2026',
  '{"competition_standings":[{"position":1,"team_name":"MVC ''t Brouwputje","played":14,"won":13,"draw":0,"lost":1,"goals_for":152,"goals_against":43,"goal_diff":109,"points":39},{"position":2,"team_name":"MVC Moeder Harelbeekse","played":14,"won":11,"draw":0,"lost":3,"goals_for":104,"goals_against":71,"goal_diff":33,"points":33},{"position":3,"team_name":"Garage Verbeke","played":14,"won":10,"draw":0,"lost":4,"goals_for":107,"goals_against":67,"goal_diff":40,"points":30},{"position":4,"team_name":"Truuk City","played":14,"won":9,"draw":2,"lost":3,"goals_for":74,"goals_against":56,"goal_diff":18,"points":29},{"position":5,"team_name":"MVC De Gilde","played":14,"won":8,"draw":3,"lost":3,"goals_for":95,"goals_against":57,"goal_diff":38,"points":27},{"position":6,"team_name":"De Dageraad","played":14,"won":9,"draw":0,"lost":5,"goals_for":94,"goals_against":59,"goal_diff":35,"points":27},{"position":7,"team_name":"Shaktar Belledune","played":14,"won":8,"draw":1,"lost":5,"goals_for":79,"goals_against":57,"goal_diff":22,"points":25},{"position":8,"team_name":"Bemarmi Boys","played":14,"won":7,"draw":3,"lost":4,"goals_for":80,"goals_against":58,"goal_diff":22,"points":24},{"position":9,"team_name":"De Florre","played":14,"won":7,"draw":2,"lost":5,"goals_for":106,"goals_against":61,"goal_diff":45,"points":23},{"position":10,"team_name":"MVC De Plakkers","played":14,"won":4,"draw":2,"lost":8,"goals_for":71,"goals_against":80,"goal_diff":-9,"points":14},{"position":11,"team_name":"Gildeg Genoeg","played":14,"won":4,"draw":2,"lost":8,"goals_for":73,"goals_against":89,"goal_diff":-16,"points":14},{"position":12,"team_name":"Omega Hulste","played":14,"won":3,"draw":1,"lost":10,"goals_for":78,"goals_against":110,"goal_diff":-32,"points":10},{"position":13,"team_name":"MVC Timeless","played":14,"won":2,"draw":0,"lost":12,"goals_for":29,"goals_against":136,"goal_diff":-107,"points":6},{"position":14,"team_name":"MVC De Salamander","played":14,"won":1,"draw":0,"lost":13,"goals_for":29,"goals_against":122,"goal_diff":-93,"points":3},{"position":15,"team_name":"MVC De Florence","played":14,"won":1,"draw":0,"lost":13,"goals_for":52,"goals_against":157,"goal_diff":-105,"points":3}],"playoff":{"top_ranking":[{"position":1,"team_name":"MVC ''t Brouwputje","total_points":79},{"position":2,"team_name":"MVC Moeder Harelbeekse","total_points":64},{"position":3,"team_name":"Garage Verbeke","total_points":50},{"position":4,"team_name":"MVC De Gilde","total_points":47},{"position":5,"team_name":"Bemarmi Boys","total_points":46},{"position":6,"team_name":"Truuk City","total_points":38},{"position":7,"team_name":"Shaktar Belledune","total_points":36},{"position":8,"team_name":"De Dageraad","total_points":34}],"bottom_ranking":[{"position":1,"team_name":"MVC De Plakkers","total_points":47},{"position":2,"team_name":"De Florre","total_points":47},{"position":3,"team_name":"Omega Hulste","total_points":31},{"position":4,"team_name":"Gildeg Genoeg","total_points":30},{"position":5,"team_name":"MVC De Salamander","total_points":19},{"position":6,"team_name":"MVC Timeless","total_points":15},{"position":7,"team_name":"MVC De Florence","total_points":8}]}}'::jsonb,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.application_settings
  WHERE setting_category = 'season_archives'
    AND setting_name = '2025-2026'
);
