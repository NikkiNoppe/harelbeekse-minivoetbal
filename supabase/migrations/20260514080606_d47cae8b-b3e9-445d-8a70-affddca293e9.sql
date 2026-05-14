-- =====================================================================
-- MERGE referee_availability + referee_assignments => referee_matches
-- =====================================================================

-- 1. Create new unified table
CREATE TABLE public.referee_matches (
  id BIGSERIAL PRIMARY KEY,
  referee_id INTEGER NOT NULL,
  match_id INTEGER,
  
  -- Availability fields
  is_available BOOLEAN,
  availability_notes TEXT,
  poll_group_id VARCHAR,
  poll_month VARCHAR,
  
  -- Assignment fields
  status VARCHAR,
  assigned_by INTEGER,
  assigned_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  assignment_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT referee_matches_status_check CHECK (status IS NULL OR status IN ('pending','confirmed','declined','cancelled'))
);

-- 2. Indexes & unique constraints
CREATE UNIQUE INDEX referee_matches_unique_match
  ON public.referee_matches (referee_id, match_id)
  WHERE match_id IS NOT NULL;

CREATE UNIQUE INDEX referee_matches_unique_poll
  ON public.referee_matches (referee_id, poll_group_id, poll_month)
  WHERE match_id IS NULL AND poll_group_id IS NOT NULL;

-- One assignment per match (mirrors old referee_assignments_match_id_key)
CREATE UNIQUE INDEX referee_matches_unique_assigned_match
  ON public.referee_matches (match_id)
  WHERE match_id IS NOT NULL AND status IS NOT NULL AND status NOT IN ('declined','cancelled');

CREATE INDEX idx_referee_matches_referee ON public.referee_matches (referee_id);
CREATE INDEX idx_referee_matches_match ON public.referee_matches (match_id);
CREATE INDEX idx_referee_matches_status ON public.referee_matches (status);
CREATE INDEX idx_referee_matches_poll ON public.referee_matches (poll_month);

-- 3. updated_at trigger
CREATE TRIGGER referee_matches_updated_at
BEFORE UPDATE ON public.referee_matches
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- 4. RLS
ALTER TABLE public.referee_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage referee_matches"
  ON public.referee_matches FOR ALL
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Referees read own referee_matches"
  ON public.referee_matches FOR SELECT
  USING (referee_id = (current_setting('app.current_user_id', true))::integer);

CREATE POLICY "Referees update own assignment status"
  ON public.referee_matches FOR UPDATE
  USING (referee_id = (current_setting('app.current_user_id', true))::integer
         AND get_current_user_role() = 'referee')
  WITH CHECK (referee_id = (current_setting('app.current_user_id', true))::integer
              AND get_current_user_role() = 'referee');

-- Allow referees to upsert their own availability rows
CREATE POLICY "Referees insert own availability"
  ON public.referee_matches FOR INSERT
  WITH CHECK (referee_id = (current_setting('app.current_user_id', true))::integer);

-- 5. Grants (per project convention)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referee_matches TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.referee_matches_id_seq TO authenticated;

-- =====================================================================
-- 6. BACKFILL DATA
-- =====================================================================

-- 6a. Insert availability rows (status null = only availability info)
INSERT INTO public.referee_matches (
  referee_id, match_id, is_available, availability_notes,
  poll_group_id, poll_month, created_at, updated_at
)
SELECT
  ra.user_id, ra.match_id, ra.is_available, ra.notes,
  ra.poll_group_id, ra.poll_month,
  COALESCE(ra.created_at, now()), COALESCE(ra.updated_at, now())
FROM public.referee_availability ra;

-- 6b. Merge assignment rows: update existing (referee, match) row, or insert new
DO $$
DECLARE
  r RECORD;
  v_match_poll_month VARCHAR;
BEGIN
  FOR r IN SELECT * FROM public.referee_assignments LOOP
    -- Try to update existing availability row
    UPDATE public.referee_matches
    SET status = r.status,
        assigned_by = r.assigned_by,
        assigned_at = r.assigned_at,
        confirmed_at = r.confirmed_at,
        assignment_notes = r.notes,
        updated_at = now()
    WHERE referee_id = r.referee_id
      AND match_id = r.match_id;
    
    IF NOT FOUND THEN
      -- Compute poll_month from match_date for context
      SELECT to_char(match_date, 'YYYY-MM') INTO v_match_poll_month
      FROM public.matches WHERE matches.match_id = r.match_id;
      
      INSERT INTO public.referee_matches (
        referee_id, match_id, status, assigned_by, assigned_at,
        confirmed_at, assignment_notes, poll_month, created_at, updated_at
      ) VALUES (
        r.referee_id, r.match_id, r.status, r.assigned_by, r.assigned_at,
        r.confirmed_at, r.notes, v_match_poll_month, r.assigned_at, now()
      );
    END IF;
  END LOOP;
END $$;

-- =====================================================================
-- 7. UPDATE RPCs to use referee_matches
-- =====================================================================

CREATE OR REPLACE FUNCTION public.check_referee_conflict(p_referee_id integer, p_match_id integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_match_date DATE;
  v_match_location TEXT;
  v_has_conflict BOOLEAN;
BEGIN
  SELECT DATE(match_date), COALESCE(location, '') INTO v_match_date, v_match_location
  FROM public.matches WHERE match_id = p_match_id;
  
  SELECT EXISTS (
    SELECT 1 
    FROM public.referee_matches rm
    JOIN public.matches m ON rm.match_id = m.match_id
    WHERE rm.referee_id = p_referee_id
      AND DATE(m.match_date) = v_match_date
      AND COALESCE(m.location, '') != v_match_location
      AND rm.match_id != p_match_id
      AND rm.status IS NOT NULL
      AND rm.status NOT IN ('declined','cancelled')
  ) INTO v_has_conflict;
  
  RETURN v_has_conflict;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_referee_to_match(p_user_id integer, p_match_id integer, p_referee_id integer, p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
  v_has_conflict BOOLEAN;
  v_assignment_id BIGINT;
  v_referee_username TEXT;
  v_poll_month VARCHAR;
BEGIN
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen scheidsrechters toewijzen');
  END IF;
  
  v_has_conflict := public.check_referee_conflict(p_referee_id, p_match_id);
  IF v_has_conflict THEN
    RETURN jsonb_build_object('success', false, 'error', 'Scheidsrechter is al toegewezen aan een andere wedstrijd op deze dag');
  END IF;
  
  SELECT to_char(match_date, 'YYYY-MM') INTO v_poll_month FROM matches WHERE match_id = p_match_id;
  
  -- Upsert: assignment may overlap with existing availability row
  INSERT INTO public.referee_matches (referee_id, match_id, status, assigned_by, assigned_at, assignment_notes, poll_month)
  VALUES (p_referee_id, p_match_id, 'pending', p_user_id, now(), p_notes, v_poll_month)
  ON CONFLICT (referee_id, match_id) WHERE match_id IS NOT NULL
  DO UPDATE SET status = 'pending',
                assigned_by = EXCLUDED.assigned_by,
                assigned_at = EXCLUDED.assigned_at,
                assignment_notes = EXCLUDED.assignment_notes,
                updated_at = now()
  RETURNING id INTO v_assignment_id;
  
  SELECT username INTO v_referee_username FROM public.users WHERE user_id = p_referee_id;
  IF v_referee_username IS NOT NULL THEN
    UPDATE public.matches
    SET assigned_referee_id = p_referee_id, referee = v_referee_username
    WHERE match_id = p_match_id;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'assignment_id', v_assignment_id, 'message', 'Scheidsrechter succesvol toegewezen');

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd heeft al een scheidsrechter toegewezen');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onverwachte fout: ' || SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_referee_to_session(p_user_id integer, p_match_id integer, p_referee_id integer, p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
  v_match_date DATE;
  v_match_location TEXT;
  v_has_conflict BOOLEAN;
  v_referee_username TEXT;
  v_session_match RECORD;
  v_assignment_count INTEGER := 0;
  v_poll_month VARCHAR;
BEGIN
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen scheidsrechters toewijzen');
  END IF;

  SELECT DATE(match_date), COALESCE(location, ''), to_char(match_date, 'YYYY-MM')
  INTO v_match_date, v_match_location, v_poll_month
  FROM matches WHERE match_id = p_match_id;

  IF v_match_date IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd niet gevonden');
  END IF;

  v_has_conflict := public.check_referee_conflict(p_referee_id, p_match_id);
  IF v_has_conflict THEN
    RETURN jsonb_build_object('success', false, 'error', 'Scheidsrechter is al toegewezen op een andere locatie op deze dag');
  END IF;

  SELECT username INTO v_referee_username FROM users WHERE user_id = p_referee_id;

  FOR v_session_match IN
    SELECT match_id FROM matches
    WHERE DATE(match_date) = v_match_date AND COALESCE(location, '') = v_match_location
  LOOP
    -- Skip if already actively assigned to anyone
    IF NOT EXISTS (
      SELECT 1 FROM referee_matches
      WHERE match_id = v_session_match.match_id
        AND status IS NOT NULL AND status NOT IN ('declined','cancelled')
    ) THEN
      INSERT INTO referee_matches (referee_id, match_id, status, assigned_by, assigned_at, assignment_notes, poll_month)
      VALUES (p_referee_id, v_session_match.match_id, 'pending', p_user_id, now(), p_notes, v_poll_month)
      ON CONFLICT (referee_id, match_id) WHERE match_id IS NOT NULL
      DO UPDATE SET status = 'pending',
                    assigned_by = EXCLUDED.assigned_by,
                    assigned_at = EXCLUDED.assigned_at,
                    assignment_notes = EXCLUDED.assignment_notes,
                    updated_at = now();
      
      UPDATE matches
      SET assigned_referee_id = p_referee_id, referee = v_referee_username
      WHERE match_id = v_session_match.match_id;
      
      v_assignment_count := v_assignment_count + 1;
    END IF;
  END LOOP;

  IF v_assignment_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alle wedstrijden in deze sessie zijn al toegewezen');
  END IF;

  RETURN jsonb_build_object('success', true, 'assignments_created', v_assignment_count,
    'message', format('Scheidsrechter toegewezen aan %s wedstrijd(en)', v_assignment_count));

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd heeft al een scheidsrechter toegewezen');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onverwachte fout: ' || SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_referee_assignment(p_user_id integer, p_assignment_id integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
  v_match_id INTEGER;
  v_has_availability BOOLEAN;
BEGIN
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen toewijzingen verwijderen');
  END IF;
  
  SELECT match_id, (is_available IS NOT NULL) INTO v_match_id, v_has_availability
  FROM public.referee_matches WHERE id = p_assignment_id;
  
  IF v_match_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Toewijzing niet gevonden');
  END IF;
  
  -- Keep row if availability info present, otherwise delete
  IF v_has_availability THEN
    UPDATE public.referee_matches
    SET status = NULL, assigned_by = NULL, assigned_at = NULL,
        confirmed_at = NULL, assignment_notes = NULL, updated_at = now()
    WHERE id = p_assignment_id;
  ELSE
    DELETE FROM public.referee_matches WHERE id = p_assignment_id;
  END IF;
  
  UPDATE public.matches
  SET assigned_referee_id = NULL, referee = NULL
  WHERE match_id = v_match_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Toewijzing verwijderd');
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_referee_from_session(p_user_id integer, p_match_id integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
  v_match_date DATE;
  v_match_location TEXT;
  v_removed_count INTEGER := 0;
  v_session_match RECORD;
BEGIN
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen toewijzingen verwijderen');
  END IF;

  SELECT DATE(match_date), COALESCE(location, '') INTO v_match_date, v_match_location
  FROM matches WHERE match_id = p_match_id;

  IF v_match_date IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd niet gevonden');
  END IF;

  FOR v_session_match IN
    SELECT m.match_id FROM matches m
    WHERE DATE(m.match_date) = v_match_date AND COALESCE(m.location, '') = v_match_location
  LOOP
    -- Clear assignment fields, keep availability
    UPDATE referee_matches
    SET status = NULL, assigned_by = NULL, assigned_at = NULL,
        confirmed_at = NULL, assignment_notes = NULL, updated_at = now()
    WHERE match_id = v_session_match.match_id AND status IS NOT NULL;
    
    -- Delete pure-assignment rows (no availability)
    DELETE FROM referee_matches
    WHERE match_id = v_session_match.match_id AND is_available IS NULL AND status IS NULL;
    
    UPDATE matches SET assigned_referee_id = NULL, referee = NULL
    WHERE match_id = v_session_match.match_id;
    
    v_removed_count := v_removed_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'removed_count', v_removed_count,
    'message', format('%s toewijzing(en) verwijderd', v_removed_count));
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_available_referees_for_match(p_match_id integer)
RETURNS TABLE(user_id integer, username character varying, is_available boolean, has_conflict boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_match_date DATE;
  v_poll_month VARCHAR;
BEGIN
  SELECT DATE(match_date), to_char(match_date, 'YYYY-MM')
  INTO v_match_date, v_poll_month
  FROM public.matches WHERE matches.match_id = p_match_id;
  
  RETURN QUERY
  SELECT 
    u.user_id, u.username,
    COALESCE(rm.is_available, false) as is_available,
    public.check_referee_conflict(u.user_id, p_match_id) as has_conflict
  FROM public.users u
  LEFT JOIN public.referee_matches rm ON (
    rm.referee_id = u.user_id 
    AND (rm.match_id = p_match_id OR (rm.match_id IS NULL AND rm.poll_month = v_poll_month))
  )
  WHERE u.role = 'referee'
  ORDER BY u.username;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_referee_availability(p_admin_user_id integer, p_poll_month text)
RETURNS TABLE(user_id integer, match_id integer, poll_group_id text, is_available boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_role public.user_role;
BEGIN
  SELECT role INTO v_admin_role FROM public.users WHERE users.user_id = p_admin_user_id;
  IF v_admin_role IS DISTINCT FROM 'admin'::public.user_role THEN
    RAISE EXCEPTION 'Only admins can read referee availability';
  END IF;

  RETURN QUERY
  SELECT rm.referee_id, rm.match_id, rm.poll_group_id::text, rm.is_available
  FROM public.referee_matches rm
  WHERE rm.poll_month = p_poll_month AND rm.is_available IS NOT NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_referee_availability(p_admin_user_id integer, p_referee_id integer, p_match_id integer, p_poll_group_id text, p_poll_month text, p_is_available boolean, p_notes text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_role public.user_role;
BEGIN
  SELECT role INTO v_admin_role FROM public.users WHERE user_id = p_admin_user_id;
  IF v_admin_role IS DISTINCT FROM 'admin'::public.user_role THEN
    RAISE EXCEPTION 'Only admins can update referee availability';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE user_id = p_referee_id AND role = 'referee'::public.user_role) THEN
    RAISE EXCEPTION 'Referee not found';
  END IF;

  IF p_is_available IS NULL THEN
    -- Clear availability; if no assignment, delete the row
    UPDATE public.referee_matches
    SET is_available = NULL, availability_notes = NULL, updated_at = now()
    WHERE referee_id = p_referee_id
      AND ((p_match_id IS NOT NULL AND match_id = p_match_id)
        OR (p_match_id IS NULL AND poll_group_id = p_poll_group_id AND poll_month = p_poll_month));
    
    DELETE FROM public.referee_matches
    WHERE referee_id = p_referee_id
      AND is_available IS NULL AND status IS NULL
      AND ((p_match_id IS NOT NULL AND match_id = p_match_id)
        OR (p_match_id IS NULL AND poll_group_id = p_poll_group_id AND poll_month = p_poll_month));
    
    RETURN true;
  END IF;

  IF p_match_id IS NOT NULL THEN
    INSERT INTO public.referee_matches (
      referee_id, match_id, poll_group_id, poll_month,
      is_available, availability_notes, updated_at
    ) VALUES (
      p_referee_id, p_match_id, p_poll_group_id, p_poll_month,
      p_is_available, p_notes, now()
    )
    ON CONFLICT (referee_id, match_id) WHERE match_id IS NOT NULL
    DO UPDATE SET
      poll_group_id = EXCLUDED.poll_group_id,
      poll_month = EXCLUDED.poll_month,
      is_available = EXCLUDED.is_available,
      availability_notes = EXCLUDED.availability_notes,
      updated_at = now();
  ELSE
    INSERT INTO public.referee_matches (
      referee_id, match_id, poll_group_id, poll_month,
      is_available, availability_notes, updated_at
    ) VALUES (
      p_referee_id, NULL, p_poll_group_id, p_poll_month,
      p_is_available, p_notes, now()
    )
    ON CONFLICT (referee_id, poll_group_id, poll_month) WHERE match_id IS NULL AND poll_group_id IS NOT NULL
    DO UPDATE SET
      is_available = EXCLUDED.is_available,
      availability_notes = EXCLUDED.availability_notes,
      updated_at = now();
  END IF;

  RETURN true;
END;
$function$;

-- =====================================================================
-- 8. Rename old tables (keep for rollback safety)
-- =====================================================================
ALTER TABLE public.referee_assignments RENAME TO _old_referee_assignments;
ALTER TABLE public.referee_availability RENAME TO _old_referee_availability;