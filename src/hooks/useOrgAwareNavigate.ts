import { useCallback } from 'react';
import {
  type NavigateOptions,
  type To,
  useNavigate,
} from 'react-router-dom';
import { useOrganization } from '@/hooks/useOrganization';
import { buildTenantNavigationPath } from '@/config/organizationHosts';

/**
 * Navigeert binnen de app en behoudt ?org= wanneer de actieve tenant
 * niet uit de hostname komt (localhost dev, SuperAdmin override, …).
 */
export function useOrgAwareNavigate() {
  const navigate = useNavigate();
  const { organizationSlug, hostname } = useOrganization();

  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        navigate(to);
        return;
      }

      if (typeof to === 'string') {
        navigate(buildTenantNavigationPath(to, organizationSlug, hostname), options);
        return;
      }

      const pathname =
        typeof to.pathname === 'string' ? to.pathname : String(to.pathname ?? '');
      const pathWithSearch = buildTenantNavigationPath(
        to.search ? `${pathname}?${to.search}` : pathname,
        organizationSlug,
        hostname,
      );
      const [resolvedPathname, resolvedSearch = ''] = pathWithSearch.split('?');

      navigate(
        {
          ...to,
          pathname: resolvedPathname,
          search: resolvedSearch ? `?${resolvedSearch}` : to.search,
        },
        options,
      );
    },
    [navigate, organizationSlug, hostname],
  );
}
