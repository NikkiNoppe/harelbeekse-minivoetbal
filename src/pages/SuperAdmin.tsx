import React from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import { SUPERADMIN_ROUTES, ADMIN_ROUTES } from '@/config/routes';
import { isSuperAdminTenantSlug } from '@/config/superAdminTenants';
import { SuperAdminRoute } from '@/components/common/SuperAdminRoute';
import {
  SuperAdminPlatformPage,
  SuperAdminTenantPage,
} from '@/components/pages/superadmin/SuperAdminPages';
import { SuperAdminOrgHubPage } from '@/components/pages/superadmin/SuperAdminOrgHubPage';

export default function SuperAdminPlatformRoute() {
  return <SuperAdminPlatformPage />;
}

export function SuperAdminBeheerRoute() {
  return (
    <SuperAdminRoute>
      <SuperAdminOrgHubPage />
    </SuperAdminRoute>
  );
}

/** Redirect legacy /superadmin/beheer naar admin-pagina (behoud query). */
export function SuperAdminBeheerRedirect() {
  const location = useLocation();
  return (
    <Navigate
      to={{ pathname: ADMIN_ROUTES['platform-beheer'], search: location.search }}
      replace
    />
  );
}

export function SuperAdminTenantRoute() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  if (!orgSlug || !isSuperAdminTenantSlug(orgSlug)) {
    return <Navigate to={SUPERADMIN_ROUTES.platform} replace />;
  }

  return <SuperAdminTenantPage tenantSlug={orgSlug} />;
}
