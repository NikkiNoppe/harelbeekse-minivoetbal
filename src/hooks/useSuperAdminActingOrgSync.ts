import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { setSuperAdminActingOrg } from '@/lib/superAdminOrg';
import { setSuperAdminActingOrganization } from '@/services/organization/superAdminOrganizationService';

/**
 * Houdt SuperAdmin acting_organization_id in sync met de actieve site-tenant
 * (hostname / ?org= dev-switch), zodat session-RPC's de juiste org filteren.
 */
export function useSuperAdminActingOrgSync(): void {
  const { isSuperAdmin, isAuthenticated, authContextReady } = useAuth();
  const { organization, organizationSlug, isOrganizationReady } = useOrganization();
  const queryClient = useQueryClient();
  const lastSyncedOrgId = useRef<number | null>(null);

  useEffect(() => {
    lastSyncedOrgId.current = null;
  }, [organizationSlug]);

  useEffect(() => {
    if (!authContextReady || !isAuthenticated || !isSuperAdmin || !isOrganizationReady) {
      return;
    }
    if (!organization?.id) {
      return;
    }

    const orgId = organization.id;
    if (lastSyncedOrgId.current === orgId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const applied = await setSuperAdminActingOrganization(orgId);
      if (cancelled) {
        return;
      }
      if (applied) {
        setSuperAdminActingOrg({ organizationId: orgId, slug: organization.slug });
        lastSyncedOrgId.current = orgId;
        await queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] !== 'organization',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    authContextReady,
    isAuthenticated,
    isSuperAdmin,
    isOrganizationReady,
    organization?.id,
    organization?.slug,
    organizationSlug,
    queryClient,
  ]);
}
