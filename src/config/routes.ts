/**
 * Route Configuration
 * 
 * Centralized route mappings for the application.
 * All routes are defined here and can be imported throughout the app.
 * 
 * @example
 * ```tsx
 * import { PUBLIC_ROUTES, ADMIN_ROUTES, getPathFromTab } from '@/config/routes';
 * 
 * // Navigate to a public route
 * navigate(PUBLIC_ROUTES.algemeen);
 * 
 * // Navigate to an admin route
 * navigate(ADMIN_ROUTES['match-forms']);
 * 
 * // Get path from tab name
 * const path = getPathFromTab('competitie');
 * ```
 */

// Publieke routes
export const PUBLIC_ROUTES = {
  algemeen: '/algemeen',
  competitie: '/competitie',
  beker: '/beker',
  playoff: '/playoff',
  reglement: '/reglement',
  kaarten: '/kaarten',
  teams: '/teams',
  scheidsrechters: '/scheidsrechters',
} as const;

// Admin routes
export const ADMIN_ROUTES = {
  'match-forms': '/admin/match-forms',
  'match-forms-league': '/admin/match-forms/league',
  'match-forms-cup': '/admin/match-forms/cup',
  'match-forms-playoffs': '/admin/match-forms/playoffs',
  players: '/admin/players',
  teams: '/admin/teams',
  users: '/admin/users',
  competition: '/admin/competition',
  playoffs: '/admin/playoffs',
  cup: '/admin/cup',
  financial: '/admin/financial',
  settings: '/admin/settings',
  suspensions: '/admin/suspensions',
  schorsingen: '/admin/schorsingen',
  scheidsrechters: '/admin/scheidsrechters',
  'blog-management': '/admin/blog-management',
  'notification-management': '/admin/notification-management',
} as const;

// Alle routes gecombineerd
export const ALL_ROUTES = {
  ...PUBLIC_ROUTES,
  ...ADMIN_ROUTES,
} as const;

// Route guards configuratie
export const ROUTE_GUARDS = {
  // Routes die auth vereisen
  requiresAuth: Object.values(ADMIN_ROUTES),
  // Routes die admin rol vereisen
  requiresAdmin: [
    ADMIN_ROUTES.users,
    ADMIN_ROUTES.teams,
    ADMIN_ROUTES.competition,
    ADMIN_ROUTES.playoffs,
    ADMIN_ROUTES.cup,
    ADMIN_ROUTES.financial,
    ADMIN_ROUTES.settings,
    ADMIN_ROUTES.suspensions,
    ADMIN_ROUTES.schorsingen,
    ADMIN_ROUTES['blog-management'],
    ADMIN_ROUTES['notification-management'],
  ],
} as const;

// Helper functies
export type TabName = keyof typeof ALL_ROUTES;

/**
 * Get tab name from URL path
 */
export function getTabFromPath(path: string): TabName | null {
  // Check exact match first
  for (const [tab, route] of Object.entries(ALL_ROUTES)) {
    if (route === path) {
      return tab as TabName;
    }
  }
  
  // Check admin routes with subpaths (e.g., /admin/match-forms/league)
  if (path.startsWith('/admin/match-forms/')) {
    const subpath = path.replace('/admin/match-forms/', '');
    if (subpath === 'league') return 'match-forms-league';
    if (subpath === 'cup') return 'match-forms-cup';
    if (subpath === 'playoffs') return 'match-forms-playoffs';
  }
  
  // Default fallback
  if (path === '/') return 'algemeen';
  
  return null;
}

/**
 * Get URL path from tab name
 */
export function getPathFromTab(tab: string): string {
  return ALL_ROUTES[tab as TabName] || PUBLIC_ROUTES.algemeen;
}

/**
 * Check if route requires authentication
 */
export function requiresAuth(path: string): boolean {
  return ROUTE_GUARDS.requiresAuth.includes(path as any);
}

/**
 * Check if route requires admin role
 */
export function requiresAdmin(path: string): boolean {
  return ROUTE_GUARDS.requiresAdmin.includes(path as any);
}

// Route metadata interface
export interface RouteMeta {
  title: string;
  description: string;
  requiresAuth: boolean;
  requiresAdmin: boolean;
}

// Route metadata configuratie
export const ROUTE_META: Record<string, RouteMeta> = {
  // Publieke routes
  [PUBLIC_ROUTES.algemeen]: {
    title: 'Algemeen',
    description: 'Algemene informatie over de Harelbeekse Minivoetbal competitie',
    requiresAuth: false,
    requiresAdmin: false,
  },
  [PUBLIC_ROUTES.competitie]: {
    title: 'Competitie',
    description: 'Competitie overzicht, standen en uitslagen',
    requiresAuth: false,
    requiresAdmin: false,
  },
  [PUBLIC_ROUTES.beker]: {
    title: 'Beker',
    description: 'Beker competitie overzicht en uitslagen',
    requiresAuth: false,
    requiresAdmin: false,
  },
  [PUBLIC_ROUTES.playoff]: {
    title: 'Playoff',
    description: 'Playoff competitie overzicht en uitslagen',
    requiresAuth: false,
    requiresAdmin: false,
  },
  [PUBLIC_ROUTES.reglement]: {
    title: 'Reglement',
    description: 'Reglement en spelregels van de Harelbeekse Minivoetbal',
    requiresAuth: false,
    requiresAdmin: false,
  },
  [PUBLIC_ROUTES.kaarten]: {
    title: 'Kaarten',
    description: 'Overzicht van kaarten en schorsingen',
    requiresAuth: false,
    requiresAdmin: false,
  },
  [PUBLIC_ROUTES.teams]: {
    title: 'Teams',
    description: 'Overzicht van alle teams',
    requiresAuth: false,
    requiresAdmin: false,
  },
  [PUBLIC_ROUTES.scheidsrechters]: {
    title: 'Scheidsrechters',
    description: 'Overzicht van scheidsrechters',
    requiresAuth: false,
    requiresAdmin: false,
  },
  
  // Admin routes
  [ADMIN_ROUTES['match-forms']]: {
    title: 'Wedstrijdformulieren',
    description: 'Beheer wedstrijdformulieren',
    requiresAuth: true,
    requiresAdmin: false,
  },
  [ADMIN_ROUTES['match-forms-league']]: {
    title: 'Competitie Wedstrijdformulieren',
    description: 'Beheer competitie wedstrijdformulieren',
    requiresAuth: true,
    requiresAdmin: false,
  },
  [ADMIN_ROUTES['match-forms-cup']]: {
    title: 'Beker Wedstrijdformulieren',
    description: 'Beheer beker wedstrijdformulieren',
    requiresAuth: true,
    requiresAdmin: false,
  },
  [ADMIN_ROUTES['match-forms-playoffs']]: {
    title: 'Playoff Wedstrijdformulieren',
    description: 'Beheer playoff wedstrijdformulieren',
    requiresAuth: true,
    requiresAdmin: false,
  },
  [ADMIN_ROUTES.players]: {
    title: 'Spelers',
    description: 'Beheer spelers',
    requiresAuth: true,
    requiresAdmin: false,
  },
  [ADMIN_ROUTES.teams]: {
    title: 'Teams Beheer',
    description: 'Beheer teams en teaminstellingen',
    requiresAuth: true,
    requiresAdmin: true,
  },
  [ADMIN_ROUTES.users]: {
    title: 'Gebruikers',
    description: 'Beheer gebruikers en rollen',
    requiresAuth: true,
    requiresAdmin: true,
  },
  [ADMIN_ROUTES.competition]: {
    title: 'Competitie Beheer',
    description: 'Beheer competitie instellingen',
    requiresAuth: true,
    requiresAdmin: true,
  },
  [ADMIN_ROUTES.playoffs]: {
    title: 'Playoff Beheer',
    description: 'Beheer playoff instellingen',
    requiresAuth: true,
    requiresAdmin: true,
  },
  [ADMIN_ROUTES.cup]: {
    title: 'Beker Beheer',
    description: 'Beheer beker instellingen',
    requiresAuth: true,
    requiresAdmin: true,
  },
  [ADMIN_ROUTES.financial]: {
    title: 'Financieel',
    description: 'Beheer financiële transacties en kosten',
    requiresAuth: true,
    requiresAdmin: true,
  },
  [ADMIN_ROUTES.settings]: {
    title: 'Instellingen',
    description: 'Beheer applicatie instellingen',
    requiresAuth: true,
    requiresAdmin: true,
  },
  [ADMIN_ROUTES.suspensions]: {
    title: 'Schorsingen',
    description: 'Beheer schorsingen',
    requiresAuth: true,
    requiresAdmin: true,
  },
  [ADMIN_ROUTES.schorsingen]: {
    title: 'Schorsingen',
    description: 'Beheer schorsingen',
    requiresAuth: true,
    requiresAdmin: true,
  },
  [ADMIN_ROUTES.scheidsrechters]: {
    title: 'Scheidsrechters Beheer',
    description: 'Beheer scheidsrechters',
    requiresAuth: true,
    requiresAdmin: false,
  },
  [ADMIN_ROUTES['blog-management']]: {
    title: 'Blog Beheer',
    description: 'Beheer blog berichten',
    requiresAuth: true,
    requiresAdmin: true,
  },
  [ADMIN_ROUTES['notification-management']]: {
    title: 'Notificaties Beheer',
    description: 'Beheer notificaties',
    requiresAuth: true,
    requiresAdmin: true,
  },
};

/**
 * Get metadata for a route
 */
export function getRouteMeta(path: string): RouteMeta | null {
  return ROUTE_META[path] || null;
}

