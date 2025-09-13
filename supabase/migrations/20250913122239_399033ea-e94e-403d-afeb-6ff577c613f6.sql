-- Drop unused public views since teams data is now accessed via authenticated routes
DROP VIEW IF EXISTS teams_public;
DROP VIEW IF EXISTS players_public;