// Teams & Players Domain - Services
// Re-exports all team and player-related services from their original locations

export { playerService, type Player } from '@/services/core/playerService';
export { teamService, type Team } from '@/services/core/teamService';
export { refereeService, type Referee } from '@/services/core/refereeService';
export { 
  normalizeTeamsPreferences, 
  scoreTeamForDetails, 
  applyAdaptiveFallback,
  getSeasonalFairness,
  calculateFairnessBoost,
  type TeamPreferencesNormalized,
  type TeamSeasonalFairness,
  type SeasonalFairnessMetrics
} from '@/services/core/teamPreferencesService';
export { enhancedTeamService } from '@/services/enhancedTeamService';
