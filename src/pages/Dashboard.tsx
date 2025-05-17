
import React from "react";
import UserDashboard from "@/components/user/UserDashboard";
import { useAuth } from "@/components/auth/AuthProvider";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <UserDashboard />;
};

export default Dashboard;
