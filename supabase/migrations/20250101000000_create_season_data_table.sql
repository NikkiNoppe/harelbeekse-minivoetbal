-- Create season_data table to store season configuration
CREATE TABLE IF NOT EXISTS season_data (
  id SERIAL PRIMARY KEY,
  season_start_date DATE NOT NULL,
  season_end_date DATE NOT NULL,
  competition_formats JSONB,
  venues JSONB,
  venue_timeslots JSONB,
  vacation_periods JSONB,
  day_names JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default season data
INSERT INTO season_data (
  season_start_date, 
  season_end_date, 
  competition_formats, 
  venues, 
  venue_timeslots, 
  vacation_periods, 
  day_names
) VALUES (
  '2025-09-01',
  '2026-06-30',
  '[
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
      "description": "Reguliere competitie (enkele ronde)gevolgd door playoff tussen top 8 teams en degradatie playoff voor bottom 8 teams",
      "has_playoffs": true,
      "regular_rounds": 1
    }
  ]'::jsonb,
  '[
    {
      "venue_id": 1,
      "name": "Sporthal De Dageraad Harelbeke",
      "address": "Stasegemsesteenweg 21, 8530 Harelbeke"
    },
    {
      "venue_id": 2,
      "name": "Spothal De Vlasschaard Bavikhove",
      "address": "Vlietestraat 25, 8531 Bavikhove"
    }
  ]'::jsonb,
  '[
    {
      "timeslot_id": 1,
      "venue_id": 1,
      "day_of_week": 1,
      "start_time": "19:00",
      "end_time": "20:30"
    },
    {
      "timeslot_id": 2,
      "venue_id": 1,
      "day_of_week": 2,
      "start_time": "19:00",
      "end_time": "20:30"
    },
    {
      "timeslot_id": 3,
      "venue_id": 1,
      "day_of_week": 3,
      "start_time": "19:00",
      "end_time": "20:30"
    },
    {
      "timeslot_id": 4,
      "venue_id": 1,
      "day_of_week": 4,
      "start_time": "19:00",
      "end_time": "20:30"
    },
    {
      "timeslot_id": 5,
      "venue_id": 1,
      "day_of_week": 5,
      "start_time": "19:00",
      "end_time": "20:30"
    },
    {
      "timeslot_id": 6,
      "venue_id": 1,
      "day_of_week": 6,
      "start_time": "14:00",
      "end_time": "15:30"
    },
    {
      "timeslot_id": 7,
      "venue_id": 1,
      "day_of_week": 6,
      "start_time": "15:30",
      "end_time": "17:00"
    }
  ]'::jsonb,
  '[
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
  ]'::jsonb,
  '["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"]'::jsonb
) ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_season_data_updated_at 
    BEFORE UPDATE ON season_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 