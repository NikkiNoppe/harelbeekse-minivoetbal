import { useContext } from 'react';
import {
  OrganizationContext,
  defaultOrganizationContext,
} from '@/context/OrganizationContext';

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    return defaultOrganizationContext;
  }
  return context;
}

/** Voor TanStack Query: org klaar + id beschikbaar. */
export function useOrgQueryScope() {
  const { organizationId, isOrganizationReady } = useOrganization();
  return {
    organizationId,
    orgQueryEnabled: isOrganizationReady && organizationId != null,
  };
}
