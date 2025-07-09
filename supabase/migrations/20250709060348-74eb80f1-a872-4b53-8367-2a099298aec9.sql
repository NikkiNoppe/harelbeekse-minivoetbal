-- Remove database tables that are now hardcoded in src/constants/competitionData.ts

-- Remove competition_formats table (5 records now hardcoded)
DROP TABLE IF EXISTS public.competition_formats CASCADE;

-- Remove venues table (3 records now hardcoded) 
DROP TABLE IF EXISTS public.venues CASCADE;

-- Remove venue_timeslots table (16 records now hardcoded)
DROP TABLE IF EXISTS public.venue_timeslots CASCADE;

-- Remove vacation_periods table (4 records now hardcoded)
DROP TABLE IF EXISTS public.vacation_periods CASCADE;

-- Remove ai_generation_logs table (no longer needed with hardcoded data)
DROP TABLE IF EXISTS public.ai_generation_logs CASCADE;

-- Remove competition_configs table (no longer needed with hardcoded data)
DROP TABLE IF EXISTS public.competition_configs CASCADE;

-- Remove team_preferences table (no longer needed with hardcoded data)
DROP TABLE IF EXISTS public.team_preferences CASCADE;