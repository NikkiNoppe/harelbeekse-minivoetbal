import React from "react";
import { SidebarProvider, Sidebar } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import AdminDashboard from "./AdminDashboard";
import Footer from "@/components/pages/footer/Footer";
import Header from "@/components/pages/header/Header";
import { useAuth } from "@/components/pages/login/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";

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

  return (
    <SidebarProvider 
      defaultOpen={!isMobile}
    >
      <div className="flex flex-col bg-purple-100 w-full">
        {/* Header - always visible at top */}
        <Header 
          onLogoClick={onLogoClick} 
          onLoginClick={onLoginClick}
          onTabChange={setActiveTab}
          activeTab={activeTab}
          isAuthenticated={!!user}
          user={user}
          hasSidebar
        />
        
        {/* Main content area - fills available space between header and footer */}
        <div className="flex flex-1 w-full">
          {/* Sidebar container - will adapt to content height */}
          <Sidebar 
            collapsible={isMobile ? "offcanvas" : "icon"}
            position={isMobile ? "fixed" : "flow"}
            className="flex-shrink-0 border-r border-purple-200 shadow-xl"
            style={{ background: 'var(--purple-100)' }}
          >
            <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          </Sidebar>
          
          {/* Main content area */}
          <main className="flex-1 bg-purple-100">
            <AdminDashboard 
              activeTab={activeTab as any} 
              setActiveTab={setActiveTab as any} 
            />
          </main>
        </div>
        
        {/* Footer - always visible at bottom */}
        <Footer />
      </div>
    </SidebarProvider>
  );
}