import { useSuperAdminActingOrgSync } from '@/hooks/useSuperAdminActingOrgSync';

/** Moet binnen OrganizationProvider staan (niet in de provider zelf). */
export function SuperAdminActingOrgSync() {
  useSuperAdminActingOrgSync();
  return null;
}
