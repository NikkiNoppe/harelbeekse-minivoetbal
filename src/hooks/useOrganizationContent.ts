import { useMemo } from 'react';
import { resolveOrganizationPublicContent } from '@/config/organizationContent';
import { useOrganization } from '@/hooks/useOrganization';

export function useOrganizationContent() {
  const { organization, organizationSlug } = useOrganization();

  return useMemo(
    () =>
      resolveOrganizationPublicContent(
        organizationSlug,
        organization?.brandingSettings,
      ),
    [organizationSlug, organization?.brandingSettings],
  );
}
