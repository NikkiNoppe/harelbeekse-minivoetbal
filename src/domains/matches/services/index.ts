// Matches Domain - Services
// Re-exports all match-related services from their original locations

export { matchService, type MatchMetadata } from '@/services/match/matchService';
export { enhancedMatchService } from '@/services/match/enhancedMatchService';
export { fetchCompetitionMatches, fetchAllCards, type MatchData, type CardData } from '@/services/match/matchDataService';
export { bekerService as cupService, type CupMatch } from '@/services/match/cupService';
export { competitionService } from '@/services/match/competitionService';
export { playoffService } from '@/services/match/playoffService';
export { competitionDataService } from '@/services/competitionDataService';
