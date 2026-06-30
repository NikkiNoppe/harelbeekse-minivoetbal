import { useMemo } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import {
  DEFAULT_BRANDING,
  parseBrandingSettings,
  type OrganizationBranding,
} from '@/types/branding';

export function useBranding(): OrganizationBranding {
  const { organization } = useOrganization();

  return useMemo(
    () =>
      organization
        ? parseBrandingSettings(organization.brandingSettings)
        : DEFAULT_BRANDING,
    [organization],
  );
}
