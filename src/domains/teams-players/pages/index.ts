// Teams & Players Domain - Pages
// Admin pages for team and player management

// Admin Pages
export { default as TeamsAdminPage } from '@/components/pages/admin/teams/TeamsPage';
export { default as PlayersAdminPage } from '@/components/pages/admin/players/PlayerPage';
export { default as RefereesAdminPage } from '@/components/pages/admin/scheidsrechter/ScheidsrechtersPage';

// User/Team Manager Pages - uses same admin page with role-based access
// The PlayerPage in user/players is incomplete, referencing admin/players/PlayerPage for now
