// Matches Domain - Pages
// Public pages for competition, cup, and playoff viewing
// Admin pages for match form management

// Public Pages
export { default as CompetitionPage } from '@/components/pages/public/competition/CompetitiePage';
export { default as PlayoffPage } from '@/components/pages/public/competition/PlayOffPage';
export { default as CupPage } from '@/components/pages/public/competition/PublicBekerPage';

// Admin Pages
export { default as MatchesAdminPage } from '@/components/pages/admin/matches/MatchesPage';
export { default as CompetitionAdminPage } from '@/components/pages/admin/competition/CompetitionPage';
export { default as CupAdminPage } from '@/components/pages/admin/beker/components/BekerPage';
export { default as PlayoffAdminPage } from '@/components/pages/admin/AdminPlayoffPage';
