-- Fix season data in application_settings with correct venues and timeslots
-- This will ensure the cup tournament generator uses the correct data

-- First, check if the record exists
SELECT COUNT(*) FROM application_settings 
WHERE setting_category = 'season_data' 
  AND setting_name = 'main_config' 
  AND is_active = true;

-- Update or insert the season data with correct venues and timeslots
INSERT INTO application_settings (
  setting_category,
  setting_name,
  setting_value,
  is_active,
  created_at,
  updated_at
) VALUES (
  'season_data',
  'main_config',
  '{
    "season_start_date": "2025-09-01",
    "season_end_date": "2026-06-30",
    "competition_formats": [
      {
        "id": 1,
        "name": "Reguliere competitie (enkele ronde)",
        "description": "Elke ploeg speelt één keer tegen elke andere ploeg",
        "has_playoffs": false,
        "regular_rounds": 1
      },
      {
        "id": 2,
        "name": "Reguliere competitie (dubbele ronde)",
        "description": "Elke ploeg speelt twee keer tegen elke andere ploeg (thuis en uit)",
        "has_playoffs": false,
        "regular_rounds": 2
      },
      {
        "id": 3,
        "name": "Competitie met Play-offs (Top 8 / Bottom 8)",
        "description": "Reguliere competitie (enkele ronde) gevolgd door playoff tussen top 8 teams en degradatie playoff voor bottom 8 teams",
        "has_playoffs": true,
        "regular_rounds": 1
      }
    ],
    "venues": [
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
    ],
    "venue_timeslots": [
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
    ],
    "vacation_periods": [
      {
        "id": 1,
        "name": "Kerstvakantie",
        "start_date": "2025-12-23",
        "end_date": "2026-01-06",
        "is_active": true
      },
      {
        "id": 2,
        "name": "Krokusvakantie",
        "start_date": "2026-02-24",
        "end_date": "2026-03-02",
        "is_active": true
      },
      {
        "id": 3,
        "name": "Paasvakantie",
        "start_date": "2026-04-14",
        "end_date": "2026-04-28",
        "is_active": true
      }
    ],
    "day_names": [
      "Maandag",
      "Dinsdag",
      "Woensdag",
      "Donderdag",
      "Vrijdag",
      "Zaterdag",
      "Zondag"
    ]
  }'::jsonb,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (setting_category, setting_name)
DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- Verify the data was inserted correctly
SELECT 
  setting_category,
  setting_name,
  setting_value->>'venues' as venues,
  setting_value->>'venue_timeslots' as timeslots
FROM application_settings 
WHERE setting_category = 'season_data' 
  AND setting_name = 'main_config' 
  AND is_active = true; 