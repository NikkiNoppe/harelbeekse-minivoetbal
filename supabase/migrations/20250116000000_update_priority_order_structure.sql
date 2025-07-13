-- Migration: Update priority order structure for cup tournament scheduling
-- Date: 2025-01-16
-- Description: Update season_data to include priority information in venue_timeslots and add separate priority_order array

-- Update the venue_timeslots in application_settings to include priority information
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
      "end_time": "21:00",
      "priority": 1,
      "venue_name": "Sporthal De Dageraad Harelbeke"
    },
    {
      "timeslot_id": 2,
      "venue_id": 2,
      "day_of_week": 1,
      "start_time": "20:00",
      "end_time": "21:00",
      "priority": 2,
      "venue_name": "Sporthal De Vlasschaard Bavikhove"
    },
    {
      "timeslot_id": 3,
      "venue_id": 1,
      "day_of_week": 2,
      "start_time": "19:30",
      "end_time": "20:30",
      "priority": 3,
      "venue_name": "Sporthal De Dageraad Harelbeke"
    },
    {
      "timeslot_id": 4,
      "venue_id": 1,
      "day_of_week": 1,
      "start_time": "19:00",
      "end_time": "20:00",
      "priority": 4,
      "venue_name": "Sporthal De Dageraad Harelbeke"
    },
    {
      "timeslot_id": 5,
      "venue_id": 2,
      "day_of_week": 1,
      "start_time": "19:00",
      "end_time": "20:00",
      "priority": 5,
      "venue_name": "Sporthal De Vlasschaard Bavikhove"
    },
    {
      "timeslot_id": 6,
      "venue_id": 1,
      "day_of_week": 2,
      "start_time": "18:30",
      "end_time": "19:30",
      "priority": 6,
      "venue_name": "Sporthal De Dageraad Harelbeke"
    },
    {
      "timeslot_id": 7,
      "venue_id": 2,
      "day_of_week": 2,
      "start_time": "18:30",
      "end_time": "19:30",
      "priority": 7,
      "venue_name": "Sporthal De Vlasschaard Bavikhove"
    }
  ]'::jsonb
)
WHERE setting_category = 'season_data' 
  AND setting_name = 'main_config' 
  AND is_active = true;

-- Add priority_order array to application_settings
UPDATE application_settings 
SET setting_value = jsonb_set(
  setting_value,
  '{priority_order}',
  '[
    {
      "priority": 1,
      "venue_id": 1,
      "day_of_week": 1,
      "start_time": "20:00",
      "description": "Dageraad Maandag 20:00"
    },
    {
      "priority": 2,
      "venue_id": 2,
      "day_of_week": 1,
      "start_time": "20:00",
      "description": "Vlasschaard Maandag 20:00"
    },
    {
      "priority": 3,
      "venue_id": 1,
      "day_of_week": 2,
      "start_time": "19:30",
      "description": "Dageraad Dinsdag 19:30"
    },
    {
      "priority": 4,
      "venue_id": 1,
      "day_of_week": 1,
      "start_time": "19:00",
      "description": "Dageraad Maandag 19:00"
    },
    {
      "priority": 5,
      "venue_id": 2,
      "day_of_week": 1,
      "start_time": "19:00",
      "description": "Vlasschaard Maandag 19:00"
    },
    {
      "priority": 6,
      "venue_id": 1,
      "day_of_week": 2,
      "start_time": "18:30",
      "description": "Dageraad Dinsdag 18:30"
    },
    {
      "priority": 7,
      "venue_id": 2,
      "day_of_week": 2,
      "start_time": "18:30",
      "description": "Vlasschaard Dinsdag 18:30"
    }
  ]'::jsonb
)
WHERE setting_category = 'season_data' 
  AND setting_name = 'main_config' 
  AND is_active = true;

-- Ensure venues are correctly set with proper names
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

-- Create a separate application_settings row for fast priority order access
INSERT INTO application_settings (
  setting_category,
  setting_name,
  setting_value,
  is_active
) VALUES (
  'priority_order',
  'fast_access',
  '[
    {
      "priority": 1,
      "venue_id": 1,
      "day_of_week": 1,
      "start_time": "20:00",
      "description": "Dageraad Maandag 20:00"
    },
    {
      "priority": 2,
      "venue_id": 2,
      "day_of_week": 1,
      "start_time": "20:00",
      "description": "Vlasschaard Maandag 20:00"
    },
    {
      "priority": 3,
      "venue_id": 1,
      "day_of_week": 2,
      "start_time": "19:30",
      "description": "Dageraad Dinsdag 19:30"
    },
    {
      "priority": 4,
      "venue_id": 1,
      "day_of_week": 1,
      "start_time": "19:00",
      "description": "Dageraad Maandag 19:00"
    },
    {
      "priority": 5,
      "venue_id": 2,
      "day_of_week": 1,
      "start_time": "19:00",
      "description": "Vlasschaard Maandag 19:00"
    },
    {
      "priority": 6,
      "venue_id": 1,
      "day_of_week": 2,
      "start_time": "18:30",
      "description": "Dageraad Dinsdag 18:30"
    },
    {
      "priority": 7,
      "venue_id": 2,
      "day_of_week": 2,
      "start_time": "18:30",
      "description": "Vlasschaard Dinsdag 18:30"
    }
  ]'::jsonb,
  true
) ON CONFLICT (setting_category, setting_name) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = now(); 