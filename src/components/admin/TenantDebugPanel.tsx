import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { fetchPublicMatches, fetchPublicTeams } from '@/services/public/publicScheduleFetch';
import { withOrgQueryKey } from '@/lib/orgQueryKey';
import { cn } from '@/lib/utils';
import {
  applyDevOrgSlugToSearch,
  DEV_ORGANIZATION_LABELS,
  DEV_ORGANIZATION_SLUGS,
  isDevOrgSwitcherEnabled,
  type DevOrganizationSlug,
} from '@/config/organizationHosts';

const SHOW_DEBUG =
  import.meta.env.VITE_SHOW_TENANT_DEBUG === 'true' ||
  import.meta.env.DEV;

function DevOrgSwitchButtons({
  activeSlug,
  onSwitch,
}: {
  activeSlug: string;
  onSwitch: (slug: DevOrganizationSlug) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Wissel organisatie (dev)"
    >
      <span className="font-medium text-amber-900">Wissel:</span>
      {DEV_ORGANIZATION_SLUGS.map((slug) => {
        const isActive = activeSlug === slug;
        return (
          <button
            key={slug}
            type="button"
            onClick={() => onSwitch(slug)}
            aria-pressed={isActive}
            aria-current={isActive ? 'true' : undefined}
            className={cn(
              'min-h-[44px] rounded-md border px-3 py-2 text-xs font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2',
              isActive
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-amber-400 bg-white text-amber-950 hover:bg-amber-100',
            )}
          >
            {DEV_ORGANIZATION_LABELS[slug]}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Dev-only panel: org-switcher + (admin) hostname, counts.
 * Productie: alleen zichtbaar met VITE_SHOW_TENANT_DEBUG=true.
 */
export const TenantDebugPanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    hostname,
    organizationId,
    organizationSlug,
    organization,
    isOrganizationReady,
  } = useOrganization();

  const isAdmin = user?.role === 'admin' || user?.id === -1;
  const showSwitcher = isDevOrgSwitcherEnabled() && isOrganizationReady;

  const countsQuery = useQuery({
    queryKey: withOrgQueryKey(['tenant-debug-counts'], organizationId),
    queryFn: async () => {
      const [teams, matches] = await Promise.all([
        fetchPublicTeams(organizationId!),
        fetchPublicMatches(organizationId!),
      ]);
      return {
        teams: teams.length,
        matches: matches.length,
      };
    },
    enabled: isAdmin && isOrganizationReady && organizationId != null,
    staleTime: 30_000,
  });

  const switchOrg = (slug: DevOrganizationSlug) => {
    navigate({
      pathname: location.pathname,
      search: applyDevOrgSlugToSearch(location.search, slug),
    });
  };

  if (!SHOW_DEBUG || !showSwitcher) {
    return null;
  }

  return (
    <aside
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-300 bg-amber-50/95 px-3 py-2 text-xs text-amber-950 shadow-lg safe-area-bottom"
      aria-label="Tenant debug"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
        <DevOrgSwitchButtons activeSlug={organizationSlug} onSwitch={switchOrg} />

        {isAdmin && (
          <>
            <span className="hidden sm:inline text-amber-700" aria-hidden>
              |
            </span>
            <span className="font-semibold">Tenant debug</span>
            <span>
              Host: <code className="rounded bg-amber-100 px-1">{hostname}</code>
            </span>
            <span>
              Org: {organization?.name ?? '—'} (
              <code className="rounded bg-amber-100 px-1">{organizationSlug}</code>, id{' '}
              {organizationId})
            </span>
            {countsQuery.isFetching && (
              <span className="opacity-70">Counts laden…</span>
            )}
            {countsQuery.data && (
              <span>
                Teams: {countsQuery.data.teams} · Matches: {countsQuery.data.matches}
              </span>
            )}
            {countsQuery.isError && (
              <span className="text-red-700">Counts: fout bij laden</span>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default TenantDebugPanel;
