import { DEFAULT_ORGANIZATION_ID } from '@/config/organization';

/** Client-side actieve tenant (gezet door OrganizationProvider). */
let resolvedOrganizationId: number | null = null;

export function setResolvedOrganizationId(organizationId: number | null | undefined): void {
  resolvedOrganizationId = organizationId ?? null;
}

export function getResolvedOrganizationId(): number | null {
  return resolvedOrganizationId;
}

/** Vereist expliciete of opgeloste org-id; geen stille fallback in admin-paden. */
export function requireOrganizationId(explicit?: number | null): number {
  const id = explicit ?? resolvedOrganizationId;
  if (id == null) {
    throw new Error('Organisatie-context ontbreekt');
  }
  return id;
}

/** Publieke reads vóór org-resolve: expliciete id of hostname-default. */
export function resolveOrganizationIdForRead(explicit?: number | null): number {
  return explicit ?? resolvedOrganizationId ?? DEFAULT_ORGANIZATION_ID;
}

export function seasonDataStorageKey(organizationId: number): string {
  return `seasonData:${organizationId}`;
}
