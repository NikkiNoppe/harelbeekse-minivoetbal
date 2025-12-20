// Re-export from new domain location for backwards compatibility
// This service has been moved to src/domains/cards-suspensions/services/suspensionRulesService.ts

export { 
  suspensionRulesService, 
  type SuspensionRules, 
  type YellowCardRule, 
  type RedCardRules, 
  type ResetRules 
} from '@/domains/cards-suspensions/services/suspensionRulesService';
