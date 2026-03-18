import React, { useCallback } from "react";
import AdminDashboard from "./AdminDashboard";
import Footer from "@/components/pages/footer/Footer";
import Header from "@/components/pages/header/Header";
import { useAuth } from "@/hooks/useAuth";
import NotificationPopup from "@/components/common/NotificationPopup";
import PullToRefreshWrapper from "@/components/common/PullToRefreshWrapper";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQueryClient } from "@tanstack/react-query";

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
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Pull-to-refresh handler - invalidates all queries
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    await new Promise(resolve => setTimeout(resolve, 300));
  }, [queryClient]);

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh} disabled={!isMobile}>
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
    </PullToRefreshWrapper>
  );
}