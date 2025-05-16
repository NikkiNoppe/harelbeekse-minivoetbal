
import { Team, GeneratedMatch, CompetitionType } from "./types";

/**
 * Generates a round-robin competition schedule for the provided teams
 */
export const generateRoundRobinSchedule = (
  teams: Team[],
  format: CompetitionType | undefined
): GeneratedMatch[] => {
  if (!teams || teams.length < 2 || !format) {
    return [];
  }
  
  const filteredTeams = [...teams];
  const generatedMatches: GeneratedMatch[] = [];
  
  // Voor een even aantal teams
  let teamsForSchedule = [...filteredTeams];
  
  // Als we een oneven aantal teams hebben, voeg een dummy team toe
  if (teamsForSchedule.length % 2 !== 0) {
    teamsForSchedule.push({ team_id: -1, team_name: "Rust" });
  }
  
  const n = teamsForSchedule.length;
  const totalRounds = n - 1;
  
  // De eerste helft van de teams blijft op hun plaats
  const teamHome = teamsForSchedule.slice(0, n/2);
  // De tweede helft van de teams roteert tegenklokgewijs
  const teamAway = teamsForSchedule.slice(n/2);
  
  // Voor elke speeldag (n-1 speeldagen voor een volledige competitie)
  for (let round = 0; round < totalRounds; round++) {
    // Wedstrijden genereren voor deze speeldag
    for (let i = 0; i < n/2; i++) {
      // Sla wedstrijden over waar het dummy team bij betrokken is
      if (teamHome[i].team_id !== -1 && teamAway[i].team_id !== -1) {
        generatedMatches.push({
          matchday: round + 1,
          home_team_id: teamHome[i].team_id,
          away_team_id: teamAway[i].team_id,
          home_team_name: teamHome[i].team_name,
          away_team_name: teamAway[i].team_name
        });
      }
    }
    
    // Roteer de teams (eerste blijft op zijn plaats)
    const lastHomeTeam = teamHome[teamHome.length - 1];
    const firstAwayTeam = teamAway[0];
    
    // Rotatie uitvoeren
    for (let i = teamHome.length - 1; i > 0; i--) {
      teamHome[i] = teamHome[i - 1];
    }
    
    for (let i = 0; i < teamAway.length - 1; i++) {
      teamAway[i] = teamAway[i + 1];
    }
    
    teamHome[1] = firstAwayTeam;
    teamAway[teamAway.length - 1] = lastHomeTeam;
  }
  
  // Als het format dubbele wedstrijden heeft, voeg de omgekeerde wedstrijden toe
  if (format.regularRounds === 2 || format.regular_rounds === 2) {
    const secondHalfMatches = generatedMatches.map(match => ({
      matchday: match.matchday + totalRounds,
      home_team_id: match.away_team_id,
      away_team_id: match.home_team_id,
      home_team_name: match.away_team_name,
      away_team_name: match.home_team_name
    }));
    
    generatedMatches.push(...secondHalfMatches);
  }
  
  return generatedMatches;
};
