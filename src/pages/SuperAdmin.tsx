import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { SUPERADMIN_ROUTES } from '@/config/routes';
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

export function SuperAdminTenantRoute() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  if (!orgSlug || !isSuperAdminTenantSlug(orgSlug)) {
    return <Navigate to={SUPERADMIN_ROUTES.platform} replace />;
  }

  return <SuperAdminTenantPage tenantSlug={orgSlug} />;
}
