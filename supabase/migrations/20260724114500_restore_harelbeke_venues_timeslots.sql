-- Herstel Harelbeke (org 1) venues + timeslots die verdwenen zijn door
-- partial overwrite van season_data.main_config (enkel start/eind).
-- Merge via jsonb_set zodat bestaande seizoensdatums behouden blijven.

UPDATE public.application_settings
SET setting_value =
  jsonb_set(
    jsonb_set(
      COALESCE(setting_value, '{}'::jsonb),
      '{venues}',
      '[
        {
          "venue_id": 1,
          "name": "Harelbeke - Dageraad",
          "address": "Stasegemsesteenweg 21, 8530 Harelbeke"
        },
        {
          "venue_id": 2,
          "name": "Bavikhove - Vlasschaard",
          "address": "Vlietestraat 25, 8531 Bavikhove"
        }
      ]'::jsonb,
      true
    ),
    '{venue_timeslots}',
    '[
      {
        "timeslot_id": 1,
        "venue_id": 1,
        "day_of_week": 1,
        "start_time": "20:00",
        "end_time": "21:00",
        "priority": 1,
        "venue_name": "Harelbeke - Dageraad"
      },
      {
        "timeslot_id": 2,
        "venue_id": 2,
        "day_of_week": 1,
        "start_time": "20:00",
        "end_time": "21:00",
        "priority": 2,
        "venue_name": "Bavikhove - Vlasschaard"
      },
      {
        "timeslot_id": 3,
        "venue_id": 1,
        "day_of_week": 2,
        "start_time": "19:30",
        "end_time": "20:30",
        "priority": 3,
        "venue_name": "Harelbeke - Dageraad"
      },
      {
        "timeslot_id": 4,
        "venue_id": 1,
        "day_of_week": 1,
        "start_time": "19:00",
        "end_time": "20:00",
        "priority": 4,
        "venue_name": "Harelbeke - Dageraad"
      },
      {
        "timeslot_id": 5,
        "venue_id": 2,
        "day_of_week": 1,
        "start_time": "19:00",
        "end_time": "20:00",
        "priority": 5,
        "venue_name": "Bavikhove - Vlasschaard"
      },
      {
        "timeslot_id": 6,
        "venue_id": 1,
        "day_of_week": 2,
        "start_time": "18:30",
        "end_time": "19:30",
        "priority": 6,
        "venue_name": "Harelbeke - Dageraad"
      },
      {
        "timeslot_id": 7,
        "venue_id": 2,
        "day_of_week": 2,
        "start_time": "18:30",
        "end_time": "19:30",
        "priority": 7,
        "venue_name": "Bavikhove - Vlasschaard"
      }
    ]'::jsonb,
    true
  )
WHERE organization_id = 1
  AND setting_category = 'season_data'
  AND setting_name = 'main_config'
  AND (
    setting_value->'venues' IS NULL
    OR jsonb_typeof(setting_value->'venues') <> 'array'
    OR jsonb_array_length(COALESCE(setting_value->'venues', '[]'::jsonb)) = 0
  );
