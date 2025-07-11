// Main Services Index
// This file provides centralized access to all services

// Core Services - Basic entity management
export { refereeService, type Referee } from './core/refereeService';
export { playerService, type Player } from './core/playerService';
export { teamService, type Team } from './core/teamService';

// Optimized Services - React Query enhanced versions
export { optimizedRefereeService } from './optimized/optimizedRefereeService';
export { optimizedPlayerService } from './optimized/optimizedPlayerService';

// Admin Services - Administrative operations
export { adminService, type AdminUser } from './admin/adminService';

// Financial Services - Cost management and reporting
export { financialService, type FinancialSettings } from './financial/financialService';
export { costSettingsService, type CostSetting } from './financial/costSettingsService';
export { enhancedCostSettingsService, type TeamTransaction } from './financial/enhancedCostSettingsService';
export { monthlyReportsService, type MonthlyReport } from './financial/monthlyReportsService';

// Match Services - Match management and cup tournaments
export { matchService } from './match/matchService';
export { enhancedMatchService } from './match/enhancedMatchService';
export { fetchCompetitionMatches, fetchAllCards, type MatchData, type CardData } from './match/matchDataService';
export { cupService, type CupMatch } from './match/cupService';

// Individual services that don't fit in categories
export { fetchBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, type BlogPost } from './blogService';
export { seasonService, type SeasonData } from './seasonService';
export { timeslotPriorityService } from './timeslotPriorityService';
export { competitionDataService } from './competitionDataService';
export { enhancedTeamService } from './enhancedTeamService';
export { suspensionService, type Suspension, type PlayerCard } from './suspensionService';
export { cleanupTestData } from './cleanupService'; 