// Re-export from new domain location for backwards compatibility
// This service has been moved to src/domains/cards-suspensions/services/suspensionService.ts

export { 
  suspensionService, 
  type PlayerCard, 
  type Suspension 
} from '@/domains/cards-suspensions/services/suspensionService';

