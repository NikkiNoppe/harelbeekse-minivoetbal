import React from "react";
import AdminDashboard from "./AdminDashboard";
import Footer from "@/components/pages/footer/Footer";
import Header from "@/components/pages/header/Header";
import { useAuth } from "@/components/pages/login/AuthProvider";
import NotificationPopup from "@/components/common/NotificationPopup";

interface AdminDashboardLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogoClick: () => void;
  onLoginClick: () => void;
}

export function AdminDashboardLayout({ 
  activeTab, 
  setActiveTab, 
  onLogoClick, 
  onLoginClick 
}: AdminDashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col bg-purple-100 w-full min-h-screen">
      {/* Header - always visible at top */}
      <Header 
        onLogoClick={onLogoClick} 
        onLoginClick={onLoginClick}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        isAuthenticated={!!user}
        user={user}
      />

      {/* Main content area */}
      <main className="flex-1 bg-purple-100">
        <AdminDashboard 
          activeTab={activeTab as any} 
          setActiveTab={setActiveTab as any} 
        />
      </main>

      {/* Footer - always visible at bottom */}
      <Footer />

      {/* Notification popup for admin users */}
      <NotificationPopup />
    </div>
  );
}