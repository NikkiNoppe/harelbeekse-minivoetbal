-- Phase 1: Database compatibility triggers and functions

-- Function to automatically generate poll_month from match_date
CREATE OR REPLACE FUNCTION public.auto_generate_poll_month()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate poll_month from match_date if not provided
  IF NEW.poll_month IS NULL AND NEW.match_date IS NOT NULL THEN
    NEW.poll_month := to_char(NEW.match_date, 'YYYY-MM');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate poll_month
CREATE TRIGGER trigger_auto_generate_poll_month
  BEFORE INSERT OR UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_poll_month();

-- Function to sync referee fields (keep both referee text and assigned_referee_id in sync)
CREATE OR REPLACE FUNCTION public.sync_referee_fields()
RETURNS TRIGGER AS $$
DECLARE
  referee_name text;
BEGIN
  -- If assigned_referee_id is set, get the referee name
  IF NEW.assigned_referee_id IS NOT NULL AND (OLD.assigned_referee_id IS NULL OR OLD.assigned_referee_id != NEW.assigned_referee_id) THEN
    SELECT username INTO referee_name 
    FROM public.users 
    WHERE user_id = NEW.assigned_referee_id AND role = 'referee';
    
    IF referee_name IS NOT NULL THEN
      NEW.referee := referee_name;
    END IF;
  END IF;
  
  -- If referee text is cleared, also clear assigned_referee_id
  IF NEW.referee IS NULL OR NEW.referee = '' THEN
    NEW.assigned_referee_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync referee fields
CREATE TRIGGER trigger_sync_referee_fields
  BEFORE INSERT OR UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_referee_fields();

-- Create a view for backward compatibility that includes poll data
CREATE OR REPLACE VIEW public.matches_with_poll_info AS
SELECT 
  m.*,
  CASE 
    WHEN m.poll_group_id IS NOT NULL THEN true 
    ELSE false 
  END as has_poll_data,
  ra.is_available as referee_available_for_poll
FROM public.matches m
LEFT JOIN public.referee_availability ra ON m.poll_group_id = ra.poll_group_id 
  AND m.poll_month = ra.poll_month;