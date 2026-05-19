
CREATE TABLE public.season_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_label text NOT NULL UNIQUE,
  competition_standings jsonb,
  cup_winner jsonb,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archived_by integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.season_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read season archives"
  ON public.season_archives FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert season archives"
  ON public.season_archives FOR INSERT
  TO anon, authenticated
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update season archives"
  ON public.season_archives FOR UPDATE
  TO anon, authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete season archives"
  ON public.season_archives FOR DELETE
  TO anon, authenticated
  USING (get_current_user_role() = 'admin');

GRANT SELECT ON public.season_archives TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.season_archives TO anon, authenticated;

CREATE INDEX idx_season_archives_label ON public.season_archives (season_label DESC);

CREATE OR REPLACE FUNCTION public.update_season_archives_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_season_archives_updated_at_trg
  BEFORE UPDATE ON public.season_archives
  FOR EACH ROW EXECUTE FUNCTION public.update_season_archives_updated_at();
