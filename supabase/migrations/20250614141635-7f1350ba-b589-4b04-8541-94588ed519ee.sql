
-- Enable Row Level Security on the players table
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Allow all users to update any player (for development/testing)
CREATE POLICY "Allow all updates to players for testing"
  ON public.players
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow all users to delete any player (for development/testing)
CREATE POLICY "Allow all deletes to players for testing"
  ON public.players
  FOR DELETE
  USING (true);
