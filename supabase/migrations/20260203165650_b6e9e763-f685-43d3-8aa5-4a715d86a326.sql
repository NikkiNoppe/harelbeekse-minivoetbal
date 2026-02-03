-- =====================================================
-- SCHEIDSRECHTER BESCHIKBAARHEID & TOEWIJZING SYSTEEM
-- =====================================================

-- 1. MONTHLY_POLLS tabel - Maandelijkse polls beheer
CREATE TABLE IF NOT EXISTS public.monthly_polls (
  id SERIAL PRIMARY KEY,
  poll_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  deadline TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'processing', 'completed')),
  created_by INTEGER REFERENCES public.users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  UNIQUE(poll_month)
);

-- 2. POLL_MATCH_DATES tabel - Wedstrijddatums in een poll
CREATE TABLE IF NOT EXISTS public.poll_match_dates (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL REFERENCES public.monthly_polls(id) ON DELETE CASCADE,
  match_date DATE NOT NULL,
  location TEXT,
  time_slot VARCHAR(20), -- e.g., "19:00-21:00"
  match_count INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. REFEREE_ASSIGNMENTS tabel - Formele toewijzingen
CREATE TABLE IF NOT EXISTS public.referee_assignments (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES public.matches(match_id) ON DELETE CASCADE,
  referee_id INTEGER NOT NULL REFERENCES public.users(user_id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by INTEGER REFERENCES public.users(user_id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(match_id) -- Eén scheidsrechter per wedstrijd
);

-- 4. Voeg updated_at kolom toe aan referee_availability als die niet bestaat
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'referee_availability' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.referee_availability ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'referee_availability' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.referee_availability ADD COLUMN notes TEXT;
  END IF;
END $$;

-- 5. Indexen voor betere performance
CREATE INDEX IF NOT EXISTS idx_monthly_polls_month ON public.monthly_polls(poll_month);
CREATE INDEX IF NOT EXISTS idx_monthly_polls_status ON public.monthly_polls(status);
CREATE INDEX IF NOT EXISTS idx_poll_match_dates_poll ON public.poll_match_dates(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_match_dates_date ON public.poll_match_dates(match_date);
CREATE INDEX IF NOT EXISTS idx_referee_assignments_match ON public.referee_assignments(match_id);
CREATE INDEX IF NOT EXISTS idx_referee_assignments_referee ON public.referee_assignments(referee_id);
CREATE INDEX IF NOT EXISTS idx_referee_assignments_status ON public.referee_assignments(status);
CREATE INDEX IF NOT EXISTS idx_referee_availability_user_month ON public.referee_availability(user_id, poll_month);

-- 6. Trigger voor updated_at
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_monthly_polls_modtime ON public.monthly_polls;
CREATE TRIGGER update_monthly_polls_modtime 
  BEFORE UPDATE ON public.monthly_polls 
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_referee_availability_modtime ON public.referee_availability;
CREATE TRIGGER update_referee_availability_modtime 
  BEFORE UPDATE ON public.referee_availability 
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.monthly_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_match_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referee_assignments ENABLE ROW LEVEL SECURITY;

-- MONTHLY_POLLS policies
CREATE POLICY "Admins can manage all polls" ON public.monthly_polls
  FOR ALL USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Authenticated users can read open polls" ON public.monthly_polls
  FOR SELECT USING (status IN ('open', 'closed', 'completed'));

-- POLL_MATCH_DATES policies
CREATE POLICY "Admins can manage poll match dates" ON public.poll_match_dates
  FOR ALL USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Authenticated users can read poll match dates" ON public.poll_match_dates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.monthly_polls 
      WHERE id = poll_match_dates.poll_id 
      AND status IN ('open', 'closed', 'completed')
    )
  );

-- REFEREE_ASSIGNMENTS policies
CREATE POLICY "Admins can manage all assignments" ON public.referee_assignments
  FOR ALL USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Referees can read their own assignments" ON public.referee_assignments
  FOR SELECT USING (
    referee_id = (current_setting('app.current_user_id', true))::integer
  );

CREATE POLICY "Referees can update their own assignment status" ON public.referee_assignments
  FOR UPDATE USING (
    referee_id = (current_setting('app.current_user_id', true))::integer
    AND get_current_user_role() = 'referee'
  )
  WITH CHECK (
    referee_id = (current_setting('app.current_user_id', true))::integer
    AND get_current_user_role() = 'referee'
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Functie om conflict te detecteren (scheidsrechter al toegewezen op dezelfde dag)
CREATE OR REPLACE FUNCTION public.check_referee_conflict(
  p_referee_id INTEGER,
  p_match_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_match_date DATE;
  v_has_conflict BOOLEAN;
BEGIN
  -- Haal datum van de nieuwe wedstrijd op
  SELECT DATE(match_date) INTO v_match_date
  FROM public.matches
  WHERE match_id = p_match_id;
  
  -- Check of scheidsrechter al een andere wedstrijd heeft op die dag
  SELECT EXISTS (
    SELECT 1 
    FROM public.referee_assignments ra
    JOIN public.matches m ON ra.match_id = m.match_id
    WHERE ra.referee_id = p_referee_id
    AND DATE(m.match_date) = v_match_date
    AND ra.match_id != p_match_id
    AND ra.status NOT IN ('declined', 'cancelled')
  ) INTO v_has_conflict;
  
  RETURN v_has_conflict;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Functie om beschikbare scheidsrechters voor een wedstrijd te krijgen
CREATE OR REPLACE FUNCTION public.get_available_referees_for_match(
  p_match_id INTEGER
) RETURNS TABLE (
  user_id INTEGER,
  username VARCHAR,
  is_available BOOLEAN,
  has_conflict BOOLEAN
) AS $$
DECLARE
  v_match_date DATE;
  v_poll_month VARCHAR;
BEGIN
  -- Haal wedstrijd info op
  SELECT DATE(match_date), to_char(match_date, 'YYYY-MM')
  INTO v_match_date, v_poll_month
  FROM public.matches
  WHERE matches.match_id = p_match_id;
  
  RETURN QUERY
  SELECT 
    u.user_id,
    u.username,
    COALESCE(ra.is_available, false) as is_available,
    public.check_referee_conflict(u.user_id, p_match_id) as has_conflict
  FROM public.users u
  LEFT JOIN public.referee_availability ra ON (
    ra.user_id = u.user_id 
    AND (ra.match_id = p_match_id OR ra.poll_month = v_poll_month)
  )
  WHERE u.role = 'referee'
  ORDER BY u.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;