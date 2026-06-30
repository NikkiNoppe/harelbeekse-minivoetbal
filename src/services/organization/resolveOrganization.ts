import {
  getCurrentHostname,
  resolveHostnameToSlug,
} from '@/config/organizationHosts';
import {
  fetchOrganizationBySlug,
  type Organization,
} from '@/services/organization/organizationService';

export class UnknownOrganizationHostnameError extends Error {
  readonly hostname: string;

  constructor(hostname: string) {
    super(`Geen organisatie gekoppeld aan hostname: ${hostname}`);
    this.name = 'UnknownOrganizationHostnameError';
    this.hostname = hostname;
  }
}

export interface ResolveOrganizationFromHostnameInput {
  hostname?: string;
  /** Expliciete slug (superadmin-pad, ?org=, dev-switcher). */
  orgSlugOverride?: string | null;
}

/**
 * Hostname is de bron van waarheid voor de actieve organisatie.
 */
export async function resolveOrganizationFromHostname(
  input: ResolveOrganizationFromHostnameInput = {},
): Promise<Organization> {
  const hostname = input.hostname ?? getCurrentHostname();
  const slug =
    input.orgSlugOverride ?? resolveHostnameToSlug(hostname);
  if (!slug) {
    throw new UnknownOrganizationHostnameError(hostname);
  }

  const organization = await fetchOrganizationBySlug(slug);
  if (!organization) {
    throw new Error(`Organisatie niet gevonden voor slug: ${slug}`);
  }

  return organization;
}

/** Controleer of ingelogde user bij hostname-org hoort (SuperAdmin uitgezonderd). */
export function userBelongsToOrganization(
  userOrganizationId: number | undefined,
  targetOrganizationId: number,
  isSuperAdmin: boolean,
): boolean {
  if (isSuperAdmin) {
    return true;
  }
  if (userOrganizationId == null || userOrganizationId <= 0) {
    return false;
  }
  return userOrganizationId === targetOrganizationId;
}
