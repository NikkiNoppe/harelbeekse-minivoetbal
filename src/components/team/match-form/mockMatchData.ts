
import { MatchFormData } from "./types";

export const MOCK_MATCH_FORMS: MatchFormData[] = [
  // Upcoming matches that team managers can fill
  {
    matchId: 1,
    uniqueNumber: "0901",
    date: "2025-01-15",
    time: "20:00",
    homeTeamId: 1,
    homeTeamName: "Garage Verbeke",
    awayTeamId: 2,
    awayTeamName: "Shakthar Truuk",
    location: "Sporthal De Bres",
    isHomeTeam: true,
    matchday: "Speeldag 9",
    isCompleted: false,
    isLocked: false
  },
  {
    matchId: 2,
    uniqueNumber: "0902",
    date: "2025-01-18",
    time: "19:30",
    homeTeamId: 3,
    homeTeamName: "De Dageraad",
    awayTeamId: 1,
    awayTeamName: "Garage Verbeke",
    location: "Sporthal Centrum",
    isHomeTeam: false,
    matchday: "Speeldag 9",
    isCompleted: false,
    isLocked: false
  },
  // Match ready for referee to add score
  {
    matchId: 3,
    uniqueNumber: "0801",
    date: "2025-01-10",
    time: "20:30",
    homeTeamId: 4,
    homeTeamName: "Cafe De Gilde",
    awayTeamId: 5,
    awayTeamName: "De Florre",
    location: "Sporthal West",
    isHomeTeam: false,
    matchday: "Speeldag 8",
    isCompleted: false,
    isLocked: false,
    playersSubmitted: true
  },
  // Completed match (locked by referee)
  {
    matchId: 4,
    uniqueNumber: "0701",
    date: "2025-01-05",
    time: "19:00",
    homeTeamId: 1,
    homeTeamName: "Garage Verbeke",
    awayTeamId: 6,
    awayTeamName: "Bemarmi Boys",
    location: "Sporthal Noord",
    isHomeTeam: true,
    matchday: "Speeldag 7",
    homeScore: 3,
    awayScore: 1,
    referee: "Jan Janssen",
    isCompleted: true,
    isLocked: true,
    refereeNotes: "Goede wedstrijd, geen incidenten"
  },
  // Another completed match
  {
    matchId: 5,
    uniqueNumber: "0702",
    date: "2025-01-05",
    time: "21:00",
    homeTeamId: 2,
    homeTeamName: "Shakthar Truuk",
    awayTeamId: 3,
    awayTeamName: "De Dageraad",
    location: "Sporthal Zuid",
    isHomeTeam: false,
    matchday: "Speeldag 7",
    homeScore: 2,
    awayScore: 2,
    referee: "Marie Pieters",
    isCompleted: true,
    isLocked: true,
    refereeNotes: "Spannende wedstrijd, 1 gele kaart uitgedeeld"
  },
  // Future match for testing
  {
    matchId: 6,
    uniqueNumber: "1001",
    date: "2025-01-25",
    time: "20:00",
    homeTeamId: 5,
    homeTeamName: "De Florre",
    awayTeamId: 1,
    awayTeamName: "Garage Verbeke",
    location: "Sporthal Oost",
    isHomeTeam: false,
    matchday: "Speeldag 10",
    isCompleted: false,
    isLocked: false
  }
];

export const getMockMatches = (teamId: number, hasElevatedPermissions: boolean): MatchFormData[] => {
  if (hasElevatedPermissions) {
    // Admin/referee sees all matches
    return MOCK_MATCH_FORMS;
  } else {
    // Team manager only sees matches for their team
    return MOCK_MATCH_FORMS.filter(match => 
      match.homeTeamId === teamId || match.awayTeamId === teamId
    );
  }
};
