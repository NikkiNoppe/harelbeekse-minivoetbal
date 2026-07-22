import { useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrgQueryScope } from '@/hooks/useOrganization';
import { useSuperAdminActingOrg } from '@/hooks/useSuperAdminActingOrg';
import { seasonService, type SeasonData } from '@/services/seasonService';

/** Org-bewuste seizoensdata voor admin-instellingen (vereist actieve tenant). */
export function useSeasonDataScope() {
  const { isSuperAdmin } = useAuth();
  const actingOrg = useSuperAdminActingOrg();
  const { organizationId, orgQueryEnabled } = useOrgQueryScope();

  const scopeOrgId = useMemo(
    () =>
      isSuperAdmin && actingOrg?.organizationId != null
        ? actingOrg.organizationId
        : organizationId,
    [isSuperAdmin, actingOrg?.organizationId, organizationId],
  );

  const scopeQueryEnabled = orgQueryEnabled && scopeOrgId != null;

  const getSeasonData = useCallback(async (): Promise<SeasonData> => {
    if (scopeOrgId == null) {
      throw new Error('Organisatie-context ontbreekt');
    }
    return seasonService.getSeasonData(scopeOrgId);
  }, [scopeOrgId]);

  const saveSeasonData = useCallback(
    async (data: SeasonData) => {
      if (scopeOrgId == null) {
        throw new Error('Organisatie-context ontbreekt');
      }
      return seasonService.saveSeasonData(data, scopeOrgId);
    },
    [scopeOrgId],
  );

  const clearSeasonDataCache = useCallback(() => {
    if (scopeOrgId != null) {
      seasonService.clearSeasonDataCache(scopeOrgId);
    }
  }, [scopeOrgId]);

  return {
    organizationId: scopeOrgId,
    orgQueryEnabled: scopeQueryEnabled,
    getSeasonData,
    saveSeasonData,
    clearSeasonDataCache,
  };
}
