
import { CompetitionType, GeneratedMatch, Team } from "./types";
import { findFormatById } from "./competitionFormats";

// Function to generate a basic round-robin schedule
const generateRoundRobinSchedule = (teams: number[], rounds: number): GeneratedMatch[] => {
  const numberOfTeams = teams.length;
  const matches: GeneratedMatch[] = [];

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < numberOfTeams / 2; i++) {
      const homeTeamIndex = (round + i) % numberOfTeams;
      const awayTeamIndex = (numberOfTeams - 1 - i + round) % numberOfTeams;

      matches.push({
        matchday: round + 1,
        home_team_id: teams[homeTeamIndex],
        away_team_id: teams[awayTeamIndex],
        home_team_name: `Team ${teams[homeTeamIndex]}`, // Replace with actual team names if available
        away_team_name: `Team ${teams[awayTeamIndex]}`, // Replace with actual team names if available
      });
    }
  }

  return matches;
};

// Add the missing generateCupSchedule function
export const generateCupSchedule = (teams: Team[]): GeneratedMatch[] => {
  const matches: GeneratedMatch[] = [];
  const teamIds = teams.map(t => t.team_id);
  
  // Simple single elimination tournament
  let currentRound = 1;
  let remainingTeams = [...teamIds];
  
  while (remainingTeams.length > 1) {
    const roundMatches: GeneratedMatch[] = [];
    
    for (let i = 0; i < remainingTeams.length; i += 2) {
      if (i + 1 < remainingTeams.length) {
        roundMatches.push({
          matchday: currentRound,
          home_team_id: remainingTeams[i],
          away_team_id: remainingTeams[i + 1],
          home_team_name: teams.find(t => t.team_id === remainingTeams[i])?.team_name || `Team ${remainingTeams[i]}`,
          away_team_name: teams.find(t => t.team_id === remainingTeams[i + 1])?.team_name || `Team ${remainingTeams[i + 1]}`,
        });
      }
    }
    
    matches.push(...roundMatches);
    remainingTeams = remainingTeams.filter((_, index) => index % 2 === 0); // Simulate winners advancing
    currentRound++;
  }
  
  return matches;
};

export const generateAdvancedSchedule = async (config: any) => {
  try {
    console.log('Generating advanced schedule with config:', config);
    
    // Basic validation
    if (!config.selectedTeams || config.selectedTeams.length < 2) {
      throw new Error('At least 2 teams are required');
    }

    const format = findFormatById(config.format);
    if (!format) {
      throw new Error('Invalid format selected');
    }

    // Handle playoff teams property safely
    const playoffTeams = format.playoffTeams || (format as any).playoff_teams || 4;

    let allMatches: GeneratedMatch[] = [];

    // Regular season matches
    if (format.regularRounds > 0) {
      const regularMatches = generateRoundRobinSchedule(config.selectedTeams, format.regularRounds);
      allMatches = allMatches.concat(regularMatches);
    }

    // Implement playoff or cup logic here based on the format
    if (format.hasPlayoffs) {
      // Example playoff logic (top N teams qualify)
      console.log(`Generating playoffs for top ${playoffTeams} teams`);
      // Add playoff matches generation logic here
    }

    if (format.isCup) {
      // Example cup logic (single elimination)
      console.log('Generating cup matches');
      // Add cup matches generation logic here
    }

    // Assign dates and times based on available dates and timeslots
    // This is a placeholder for the actual scheduling logic
    allMatches.forEach((match, index) => {
      match.match_date = config.availableDates[index % config.availableDates.length];
      match.match_time = '19:00'; // Example time
    });

    console.log('Generated matches:', allMatches);
    return allMatches;

  } catch (error) {
    console.error('Error generating advanced schedule:', error);
    throw error;
  }
};
