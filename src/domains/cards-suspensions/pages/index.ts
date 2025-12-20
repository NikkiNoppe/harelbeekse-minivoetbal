// Cards & Suspensions Domain - Pages
// Team manager view: shows only their team's suspensions
// Admin view: shows all suspensions with management capabilities

// Team Manager Page (read-only view of own team)
export { default as TeamSuspensionsPage } from '@/components/pages/admin/schorsingen/SchorsingenPage';

// Admin Page (full management of all suspensions)
export { default as AdminSuspensionsPage } from '@/components/pages/admin/suspensions/AdminSuspensionsPage';
