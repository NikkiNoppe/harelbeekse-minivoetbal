# Domain Architecture

This application is organized into 5 functional domains, each with clear responsibilities and minimal coupling to other domains.

## Domain Overview

```
src/domains/
├── matches/              # Domain 1: Matches & Scores
├── teams-players/        # Domain 2: Teams & Players
├── cards-suspensions/    # Domain 3: Cards & Suspensions
├── financial/            # Domain 4: Financial Administration
└── system/               # Domain 5: System & Admin Management
```

---

## Domain 1: Matches & Scores

**Responsibility:** All match, score, standings, and schedule-related functionality.

### What belongs here:
- Competition standings and schedules
- Cup tournament brackets and results
- Playoff matches and standings
- Match form management (referee/team input)
- Match data services

### Routes:
| Route | Type | Description |
|-------|------|-------------|
| `/competitie` | Public | Competition overview |
| `/beker` | Public | Cup tournament overview |
| `/playoff` | Public | Playoff overview |
| `/admin/match-forms/*` | Admin | Match form management |
| `/admin/competition` | Admin | Competition settings |
| `/admin/cup` | Admin | Cup settings |
| `/admin/playoffs` | Admin | Playoff settings |

### Key exports:
```typescript
import { 
  matchService, 
  competitionService,
  cupService,
  playoffService,
  useCompetitionData,
  useMatchFormsData,
  CompetitionPage,
  MatchesAdminPage
} from '@/domains/matches';
```

---

## Domain 2: Teams & Players

**Responsibility:** Team and player management, including referees.

### What belongs here:
- Team registration and settings
- Player registration and management
- Team preferences (play moments, venues)
- Referee management
- Team fairness calculations

### Routes:
| Route | Type | Description |
|-------|------|-------------|
| `/teams` | Public | Team overview |
| `/scheidsrechters` | Public | Referee overview |
| `/admin/players` | Admin | Player management |
| `/admin/teams` | Admin | Team management |
| `/admin/scheidsrechters` | Admin | Referee management |

### Key exports:
```typescript
import { 
  playerService,
  teamService,
  refereeService,
  useTeams,
  useTeamsData,
  TeamsAdminPage,
  PlayersAdminPage
} from '@/domains/teams-players';
```

---

## Domain 3: Cards & Suspensions

**Responsibility:** Card registration, suspensions, and player eligibility.

### What belongs here:
- Yellow/red card tracking
- Suspension rules and calculations
- Player eligibility checks
- Card penalty financial transactions
- Suspension management UI

### Routes:
| Route | Type | Description |
|-------|------|-------------|
| `/kaarten` | Public | Cards overview |
| `/admin/suspensions` | Admin | Suspension management (admin) |
| `/admin/schorsingen` | Admin | Team suspensions view (team manager) |

### Key exports:
```typescript
import { 
  suspensionService,
  suspensionRulesService,
  cardPenaltyService,
  useSuspensionsData,
  AdminSuspensionsPage,
  TeamSuspensionsPage
} from '@/domains/cards-suspensions';
```

### Note on cardPenaltyService:
This service handles financial transactions for cards (penalties/fines) but belongs in this domain because:
1. The transactions are triggered by card events
2. The business logic is about cards, not general finances
3. Keeps card-related functionality together

---

## Domain 4: Financial Administration

**Responsibility:** Costs, transactions, and monthly reports.

### What belongs here:
- Cost settings and categories
- Team transaction management
- Monthly financial reports
- Match cost calculations
- Financial overview dashboards

### Routes:
| Route | Type | Description |
|-------|------|-------------|
| `/admin/financial` | Admin | Financial management |

### Key exports:
```typescript
import { 
  financialService,
  costSettingsService,
  monthlyReportsService,
  useFinancialData,
  FinancialAdminPage
} from '@/domains/financial';
```

---

## Domain 5: System & Admin Management

**Responsibility:** User management, settings, content, and authentication.

### What belongs here:
- User accounts and roles
- Application settings
- Blog/content management
- Notifications
- Authentication context
- Tab visibility settings
- Player list lock settings

### Routes:
| Route | Type | Description |
|-------|------|-------------|
| `/algemeen` | Public | General information |
| `/reglement` | Public | Regulations |
| `/admin/users` | Admin | User management |
| `/admin/settings` | Admin | Application settings |
| `/admin/blog-management` | Admin | Blog management |
| `/admin/notification-management` | Admin | Notification management |

### Key exports:
```typescript
import { 
  adminService,
  blogService,
  notificationService,
  seasonService,
  useTabVisibilitySettings,
  TabVisibilityProvider,
  PlayerListLockProvider,
  UsersAdminPage,
  SettingsAdminPage
} from '@/domains/system';
```

---

## Usage Guidelines

### Importing from domains

**Preferred (domain import):**
```typescript
import { suspensionService, useSuspensionsData } from '@/domains/cards-suspensions';
```

**Also valid (legacy path - for backwards compatibility):**
```typescript
import { suspensionService } from '@/services/suspensionService';
```

### Adding new features

1. Identify which domain the feature belongs to
2. Add services to `domains/{domain}/services/`
3. Add hooks to `domains/{domain}/hooks/`
4. Add pages to `domains/{domain}/pages/`
5. Update the domain's `index.ts` to export new items
6. Update routes in `src/config/routes.ts`

### Cross-domain communication

When domains need to communicate:
1. Use shared types from `@/integrations/supabase/types`
2. Import only the specific service/hook needed
3. Keep dependencies unidirectional when possible

Example of acceptable cross-domain import:
```typescript
// In cards-suspensions domain, importing player data
import { playerService } from '@/domains/teams-players';
```

---

## Migration Notes

The following files have been relocated:

| Original Location | New Location | Notes |
|-------------------|--------------|-------|
| `services/suspensionService.ts` | `domains/cards-suspensions/services/suspensionService.ts` | Old location re-exports for compatibility |
| `services/suspensionRulesService.ts` | `domains/cards-suspensions/services/suspensionRulesService.ts` | Old location re-exports for compatibility |
| `services/financial/cardPenaltyService.ts` | `domains/cards-suspensions/services/cardPenaltyService.ts` | Moved from financial to cards domain |

All original import paths continue to work via re-exports.
