
import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/components/pages/login/AuthProvider";
import PlayerPage from "@/components/pages/admin/players/PlayerPage.tsx";
import CompetitionPage from "@/components/pages/admin/competition/CompetitionPage";
import FinancialPage from "@/components/pages/admin/financial/FinancialPage";
import UserPage from "@/components/pages/admin/users/UserPage";
import TeamsPage from "@/components/pages/admin/teams/TeamsPage";
import MatchesPage from "@/components/pages/admin/matches/MatchesPage";
import BekerPage from "@/components/pages/admin/beker/components/BekerPage";
import PlayoffPage from "@/components/pages/admin/AdminPlayoffPage";
import SettingsPage from "@/components/pages/admin/settings/SettingsPage";
import SpeelformatPage from "@/components/pages/admin/SpeelformatPage";
import AdminSidebar from "@/components/pages/admin/AdminSidebar";

type TabName = "match-forms" | "players" | "teams" | "users" | "competition" | "playoffs" | "financial" | "settings" | "cup" | "speelformat";

interface AdminDashboardProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const renderContent = () => {
    switch (activeTab) {
      case "match-forms":
        return <MatchesPage teamId={0} teamName="Admin" />;
      case "players":
        return <PlayerPage />;
      case "teams":
        return isAdmin ? <TeamsPage /> : null;
      case "users":
        return isAdmin ? <UserPage /> : null;
      case "competition":
        return isAdmin ? <CompetitionPage /> : null;
      case "playoffs":
        return isAdmin ? <PlayoffPage /> : null;
      case "cup":
        return isAdmin ? <BekerPage /> : null;
      case "financial":
        return isAdmin ? <FinancialPage /> : null;
      case "settings":
        return isAdmin ? <SettingsPage /> : null;
      case "speelformat":
        return isAdmin ? <SpeelformatPage /> : null;
      default:
        return <MatchesPage teamId={0} teamName="Admin" />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          {/* Header with sidebar trigger */}
          <header className="h-14 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            </div>
          </header>
          
          {/* Main content */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="animate-fade-in">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
