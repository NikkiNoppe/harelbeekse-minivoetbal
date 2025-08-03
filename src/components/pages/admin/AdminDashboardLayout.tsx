import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import AdminDashboard from "./AdminDashboard";
import Footer from "@/components/pages/footer/Footer";
import Header from "@/components/pages/header/Header";
import { useAuth } from "@/components/pages/login/AuthProvider";

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
    <div className="min-h-screen flex flex-col bg-purple-100">
      {/* Header - always visible at top */}
      <Header 
        onLogoClick={onLogoClick} 
        onLoginClick={onLoginClick}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        isAuthenticated={!!user}
        user={user}
      />
      
      {/* Main content area - fills available space between header and footer */}
      <div className="flex flex-1">
        <SidebarProvider>
          {/* Sidebar container - will adapt to content height */}
          <div className="w-64 flex-shrink-0 bg-gradient-to-b from-white to-gray-50 border-r border-purple-200 shadow-lg">
            <div className="p-2 h-full">
              <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </div>
          
          {/* Main content area */}
          <main className="flex-1 bg-purple-100 overflow-auto">
            {/* Sidebar trigger voor toggle functionaliteit */}
            <div className="p-4">
              <SidebarTrigger className="mb-4" />
            </div>
            
            <AdminDashboard 
              activeTab={activeTab as any} 
              setActiveTab={setActiveTab as any} 
            />
          </main>
        </SidebarProvider>
      </div>
      
      {/* Footer - always visible at bottom */}
      <Footer />
    </div>
  );
}