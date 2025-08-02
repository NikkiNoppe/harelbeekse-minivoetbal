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
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-purple-100">
        {/* Header compacter voor admin */}
        <Header 
          onLogoClick={onLogoClick} 
          onLoginClick={onLoginClick}
          onTabChange={setActiveTab}
          activeTab={activeTab}
          isAuthenticated={!!user}
          user={user}
        />
        
        <div className="flex flex-1 w-full">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          
          <main className="flex-1 bg-purple-100">
            {/* Sidebar trigger voor toggle functionaliteit */}
            <div className="p-4">
              <SidebarTrigger className="mb-4" />
            </div>
            
            <AdminDashboard 
              activeTab={activeTab as any} 
              setActiveTab={setActiveTab as any} 
            />
          </main>
        </div>
        
        <Footer />
      </div>
    </SidebarProvider>
  );
}