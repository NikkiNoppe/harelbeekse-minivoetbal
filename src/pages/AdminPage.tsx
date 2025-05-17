
import React from "react";
import AdminPanel from "@/components/admin/AdminPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import { Navigate } from "react-router-dom";

const AdminPage = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Only admin users should access this page
  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <AdminPanel />;
};

export default AdminPage;
