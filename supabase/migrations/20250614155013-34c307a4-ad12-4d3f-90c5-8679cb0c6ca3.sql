
-- Insert 5 mock wedstrijdformulieren into the matches table

INSERT INTO matches (
  match_id, unique_number, match_date, home_team_id, away_team_id,
  field_cost, referee_cost, matchday_id, is_cup_match
) VALUES
  (1001, '0101', '2025-09-01T14:00:00', 1, 2, 50, 25, NULL, false),
  (1002, '0102', '2025-09-08T16:00:00', 3, 4, 50, 25, NULL, false),
  (1003, '0103', '2025-09-15T18:00:00', 5, 6, 50, 25, NULL, false),
  (1004, '0104', '2025-09-22T19:30:00', 7, 8, 50, 25, NULL, false),
  (1005, '0105', '2025-09-29T15:00:00', 9, 10, 50, 25, NULL, false);

-- Add basic home/away teams to the teams table if not already present (optional)
INSERT INTO teams (team_id, team_name)
VALUES
  (1, 'FC Utrecht'),
  (2, 'Ajax'),
  (3, 'PSV'),
  (4, 'Feyenoord'),
  (5, 'AZ Alkmaar'),
  (6, 'FC Groningen'),
  (7, 'Heerenveen'),
  (8, 'FC Twente'),
  (9, 'Sparta Rotterdam'),
  (10, 'Vitesse')
ON CONFLICT (team_id) DO NOTHING;
