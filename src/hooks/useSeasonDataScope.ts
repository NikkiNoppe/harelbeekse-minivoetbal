import { useCallback } from 'react';
import { useOrgQueryScope } from '@/hooks/useOrganization';
import { seasonService, type SeasonData } from '@/services/seasonService';

/** Org-bewuste seizoensdata voor admin-instellingen (vereist actieve tenant). */
export function useSeasonDataScope() {
  const { organizationId, orgQueryEnabled } = useOrgQueryScope();

  const getSeasonData = useCallback(async (): Promise<SeasonData> => {
    if (organizationId == null) {
      throw new Error('Organisatie-context ontbreekt');
    }
    return seasonService.getSeasonData(organizationId);
  }, [organizationId]);

  const saveSeasonData = useCallback(
    async (data: SeasonData) => {
      if (organizationId == null) {
        throw new Error('Organisatie-context ontbreekt');
      }
      return seasonService.saveSeasonData(data, organizationId);
    },
    [organizationId],
  );

  const clearSeasonDataCache = useCallback(() => {
    if (organizationId != null) {
      seasonService.clearSeasonDataCache(organizationId);
    }
  }, [organizationId]);

  return {
    organizationId,
    orgQueryEnabled,
    getSeasonData,
    saveSeasonData,
    clearSeasonDataCache,
  };
}
