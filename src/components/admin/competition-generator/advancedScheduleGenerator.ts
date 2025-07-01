
import { Team, GeneratedMatch, CompetitionType } from "./types";

/**
 * Generates a cup (knockout) competition schedule
 * @param teams The teams participating in the cup
 * @returns Array of generated matches
 */
export const generateCupSchedule = (teams: Team[]): GeneratedMatch[] => {
  const matches: GeneratedMatch[] = [];
  
  // For knockout tournament, we create pairs of teams
  // If odd number of teams, one team gets a bye
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  
  // First round matches
  for (let i = 0; i < shuffledTeams.length - 1; i += 2) {
    const homeTeam = shuffledTeams[i];
    const awayTeam = shuffledTeams[i + 1];
    
    matches.push({
      home_team_id: homeTeam.team_id,
      away_team_id: awayTeam.team_id,
      home_team_name: homeTeam.team_name,
      away_team_name: awayTeam.team_name,
      matchday: 1 // All cup matches in first round are matchday 1
    });
  }
  
  // If odd number of teams, the last team gets a bye to next round
  if (shuffledTeams.length % 2 !== 0) {
    console.log(`Team ${shuffledTeams[shuffledTeams.length - 1].team_name} gets a bye to the next round`);
  }
  
  return matches;
};

/**
 * Generates a playoff schedule based on provided format
 * @param teams The teams participating in the playoffs
 * @param format The competition format
 * @returns Array of generated playoff matches
 */
export const generatePlayoffSchedule = (teams: Team[], format: CompetitionType): GeneratedMatch[] => {
  const matches: GeneratedMatch[] = [];
  
  // Sort teams by some criteria (like points or rank)
  // For now we'll just use the current order
  const playoffTeams = format.playoffTeams || 4;
  
  if (teams.length < playoffTeams) {
    console.error("Not enough teams for playoff format");
    return matches;
  }
  
  // Get top teams for playoff 1
  const topTeams = teams.slice(0, playoffTeams);
  
  // Create playoff matches between top teams
  for (let i = 0; i < topTeams.length; i++) {
    for (let j = i + 1; j < topTeams.length; j++) {
      matches.push({
        home_team_id: topTeams[i].team_id,
        away_team_id: topTeams[j].team_id,
        home_team_name: topTeams[i].team_name,
        away_team_name: topTeams[j].team_name,
        matchday: 30 // Playoff matches start at matchday 30 (just a convention)
      });
    }
  }
  
  // If we need playoff 2 (bottom teams)
  if (playoffTeams === 6 && teams.length >= 12) {
    // Get bottom teams for playoff 2
    const bottomTeams = teams.slice(teams.length - playoffTeams);
    
    // Create playoff matches between bottom teams
    for (let i = 0; i < bottomTeams.length; i++) {
      for (let j = i + 1; j < bottomTeams.length; j++) {
        matches.push({
          home_team_id: bottomTeams[i].team_id,
          away_team_id: bottomTeams[j].team_id,
          home_team_name: bottomTeams[i].team_name,
          away_team_name: bottomTeams[j].team_name,
          matchday: 40 // Playoff 2 matches start at matchday 40 (just a convention)
        });
      }
    }
  }
  
  return matches;
};
