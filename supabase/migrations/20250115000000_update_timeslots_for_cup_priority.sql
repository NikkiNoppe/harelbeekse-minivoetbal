-- Migration: Update timeslots for cup tournament priority system
-- Date: 2025-01-15
-- Description: Add all required timeslots for proper cup tournament scheduling

-- Update the venue_timeslots in application_settings to include all required timeslots
-- Priority order:
-- 1. Dageraad Maandag 20:00 (Priority 1)
-- 2. Vlasschaard Maandag 20:00 (Priority 2)  
-- 3. Dageraad Dinsdag 19:30 (Priority 3)
-- 4. Dageraad Maandag 19:00 (Priority 4)
-- 5. Vlasschaard Maandag 19:00 (Priority 5)
-- 6. Dageraad Dinsdag 18:30 (Priority 6)
-- 7. Vlasschaard Dinsdag 18:30 (Priority 7)

UPDATE application_settings 
SET setting_value = jsonb_set(
  setting_value,
  '{venue_timeslots}',
  '[
    {
      "timeslot_id": 1,
      "venue_id": 1,
      "day_of_week": 1,
      "start_time": "20:00",
      "end_time": "21:00"
    },
    {
      "timeslot_id": 2,
      "venue_id": 2,
      "day_of_week": 1,
      "start_time": "20:00",
      "end_time": "21:00"
    },
    {
      "timeslot_id": 3,
      "venue_id": 1,
      "day_of_week": 2,
      "start_time": "19:30",
      "end_time": "20:30"
    },
    {
      "timeslot_id": 4,
      "venue_id": 1,
      "day_of_week": 1,
      "start_time": "19:00",
      "end_time": "20:00"
    },
    {
      "timeslot_id": 5,
      "venue_id": 2,
      "day_of_week": 1,
      "start_time": "19:00",
      "end_time": "20:00"
    },
    {
      "timeslot_id": 6,
      "venue_id": 1,
      "day_of_week": 2,
      "start_time": "18:30",
      "end_time": "19:30"
    },
    {
      "timeslot_id": 7,
      "venue_id": 2,
      "day_of_week": 2,
      "start_time": "18:30",
      "end_time": "19:30"
    }
  ]'::jsonb
)
WHERE setting_category = 'season_data' 
  AND setting_name = 'main_config' 
  AND is_active = true;

-- Ensure venues are correctly set
UPDATE application_settings 
SET setting_value = jsonb_set(
  setting_value,
  '{venues}',
  '[
    {
      "venue_id": 1,
      "name": "Sporthal De Dageraad Harelbeke",
      "address": "Stasegemsesteenweg 21, 8530 Harelbeke"
    },
    {
      "venue_id": 2,
      "name": "Sporthal De Vlasschaard Bavikhove",
      "address": "Vlietestraat 25, 8531 Bavikhove"
    }
  ]'::jsonb
)
WHERE setting_category = 'season_data' 
  AND setting_name = 'main_config' 
  AND is_active = true; 