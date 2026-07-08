import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { DEFAULT_ORGANIZATION_SLUG } from '@/config/organization';
import { cn } from '@/lib/utils';
import {
  applyDevOrgSlugToSearch,
  DEV_ORGANIZATION_LABELS,
  DEV_ORGANIZATION_SLUGS,
  getOrgSlugQueryParam,
  isDevOrgSwitcherEnabled,
  type DevOrganizationSlug,
} from '@/config/organizationHosts';
import { DevRoleSwitchButtons } from '@/components/admin/DevRoleSwitchButtons';

export function isTenantDebugPanelEnabled(): boolean {
  return (
    (import.meta.env.VITE_SHOW_TENANT_DEBUG === 'true' || import.meta.env.DEV) &&
    isDevOrgSwitcherEnabled()
  );
}

const COLLAPSED_STORAGE_KEY = 'tenant-debug-panel-collapsed';

function readCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistCollapsedPreference(collapsed: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
  } catch {
    /* ignore */
  }
}

function DevOrgSwitchButtons({
  activeSlug,
  onSwitch,
}: {
  activeSlug: string;
  onSwitch: (slug: DevOrganizationSlug) => void;
}) {
  return (
    <div
      className="flex flex-nowrap items-center gap-2"
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
              'min-h-[44px] shrink-0 whitespace-nowrap rounded-md border px-3 py-2 text-xs font-semibold transition-colors',
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
 * Dev-only panel: org-switcher + rol-switcher.
 * Productie: alleen zichtbaar met VITE_SHOW_TENANT_DEBUG=true én DEV-build.
 */
export const TenantDebugPanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organizationSlug } = useOrganization();

  const panelEnabled = isTenantDebugPanelEnabled();
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);
  const effectiveOrgSlug =
    organizationSlug ||
    getOrgSlugQueryParam() ||
    DEFAULT_ORGANIZATION_SLUG;

  useEffect(() => {
    if (!panelEnabled) return;
    document.body.classList.add('has-tenant-debug-panel');
    document.body.classList.toggle('has-tenant-debug-panel-collapsed', collapsed);
    return () => {
      document.body.classList.remove('has-tenant-debug-panel');
      document.body.classList.remove('has-tenant-debug-panel-collapsed');
    };
  }, [panelEnabled, collapsed]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      persistCollapsedPreference(next);
      return next;
    });
  };

  const switchOrg = (slug: DevOrganizationSlug) => {
    navigate({
      pathname: location.pathname,
      search: applyDevOrgSlugToSearch(location.search, slug),
    });
  };

  if (!panelEnabled) {
    return null;
  }

  const orgLabel =
    DEV_ORGANIZATION_LABELS[effectiveOrgSlug as DevOrganizationSlug] ?? effectiveOrgSlug;
  const roleLabel = user?.role ?? 'Publiek';

  const panel = (
    <aside
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[1200] border-t border-amber-300 bg-amber-50/95 text-xs text-amber-950 shadow-lg safe-area-bottom backdrop-blur-sm pointer-events-auto',
        collapsed ? 'px-3 py-1' : 'px-3 py-2',
      )}
      aria-label="Tenant debug"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-1">
        <div
          className={cn(
            'flex items-center',
            collapsed ? 'justify-between gap-2' : 'justify-center',
          )}
        >
          {collapsed ? (
            <p className="min-w-0 truncate text-[11px] font-medium text-amber-900">
              Dev · {orgLabel} · {roleLabel}
            </p>
          ) : null}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls="tenant-debug-panel-content"
            aria-label={collapsed ? 'Tenant debug uitklappen' : 'Tenant debug inklappen'}
            className={cn(
              'flex min-h-[36px] min-w-[44px] items-center justify-center gap-1 rounded-md px-2 text-amber-900 transition-colors',
              'hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2',
            )}
          >
            {collapsed ? (
              <ChevronUp className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden />
            )}
            <span className="sr-only">
              {collapsed ? 'Uitklappen' : 'Inklappen'}
            </span>
          </button>
        </div>

        {!collapsed ? (
          <div
            id="tenant-debug-panel-content"
            className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-x-4"
          >
            <DevOrgSwitchButtons activeSlug={effectiveOrgSlug} onSwitch={switchOrg} />

            <DevRoleSwitchButtons
              organizationSlug={effectiveOrgSlug}
              className="shrink-0"
            />
          </div>
        ) : null}
      </div>
    </aside>
  );

  if (typeof document !== 'undefined') {
    return createPortal(panel, document.body);
  }

  return panel;
};

export default TenantDebugPanel;
