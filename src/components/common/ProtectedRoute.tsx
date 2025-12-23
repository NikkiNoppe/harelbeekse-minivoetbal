import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PUBLIC_ROUTES, requiresAuth, requiresAdmin } from "@/config/routes";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * ProtectedRoute component that checks authentication and admin role
 * Redirects to login or public page if access is denied
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-purple-600 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span>Laden...</span>
        </div>
      </div>
    );
  }

  // Check if route requires authentication
  const needsAuth = requiresAuth(location.pathname);
  
  // If route requires auth but user is not authenticated
  if (needsAuth && !isAuthenticated) {
    // Redirect to algemeen page (public) and save original location for return after login
    return <Navigate 
      to={PUBLIC_ROUTES.algemeen} 
      state={{ from: location.pathname, redirectReason: 'auth_required' }}
      replace 
    />;
  }

  // Check if route requires admin role
  const needsAdmin = requireAdmin || requiresAdmin(location.pathname);
  
  // If route requires admin but user is not admin
  if (needsAdmin && (!user || user.role !== 'admin')) {
    // Redirect to algemeen page (public) and save original location for return after login
    return <Navigate 
      to={PUBLIC_ROUTES.algemeen} 
      state={{ from: location.pathname, redirectReason: 'admin_required' }}
      replace 
    />;
  }

  // User has access, render children
  return <>{children}</>;
};

