const STORAGE_KEY = 'super_admin_acting_org';

export const SUPER_ADMIN_ACTING_ORG_CHANGED_EVENT = 'super-admin-acting-org-changed';

export interface SuperAdminActingOrg {
  organizationId: number;
  slug: string;
}

export function getSuperAdminActingOrg(): SuperAdminActingOrg | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SuperAdminActingOrg;
    if (
      typeof parsed?.organizationId !== 'number' ||
      typeof parsed?.slug !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setSuperAdminActingOrg(org: SuperAdminActingOrg): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(org));
  window.dispatchEvent(
    new CustomEvent(SUPER_ADMIN_ACTING_ORG_CHANGED_EVENT, { detail: org }),
  );
}

export function clearSuperAdminActingOrg(): void {
  localStorage.removeItem(STORAGE_KEY);
}
