import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SUPERADMIN_ROUTES } from '@/config/routes';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { loading, isAuthenticated, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to={SUPERADMIN_ROUTES.platform} replace />;
  }

  return <>{children}</>;
};
