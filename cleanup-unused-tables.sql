-- Cleanup script to remove unused tables
-- This script removes tables that are no longer used in the application

-- Drop tables in the correct order (respecting foreign key constraints)

-- 1. Drop manual_schedule_matches first (it references manual_competition_schedules)
DROP TABLE IF EXISTS manual_schedule_matches;

-- 2. Drop manual_competition_schedules
DROP TABLE IF EXISTS manual_competition_schedules;

-- 3. Drop cost_setting_audit_log
DROP TABLE IF EXISTS cost_setting_audit_log;

-- 4. Drop competitions
DROP TABLE IF EXISTS competitions;

-- 5. Drop available_dates
DROP TABLE IF EXISTS available_dates;

-- Note: All wedstrijden (matches) now go directly into the 'matches' table
-- Manual competition schedules are no longer needed as they were replaced by the new competition generator
-- The audit log was not being used for cost settings
-- Available dates were replaced by the new competition generator system 