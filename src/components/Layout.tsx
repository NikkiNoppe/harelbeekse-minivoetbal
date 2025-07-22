
import React, { useState, useEffect } from "react";
import Header from "@/components/pages/header/Header";
import Footer from "@/components/pages/footer/Footer";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import LoginForm from "@/components/auth/LoginForm";
import MainPages from "@/components/pages/MainPages";
import PlayersList from "@/components/pages/admin/players/components/PlayersList";
import AdminTeamPage from "@/components/pages/admin/teams/TeamsPage";
import AdminUserPage from "@/components/pages/admin/users/UserPage";
import AdminCompetitionPage from "@/components/pages/admin/competition/CompetitionPage";
import AdminPlayoffPage from "@/components/pages/admin/AdminPlayoffPage";
import CupTournamentManager from "@/components/pages/admin/beker/components/CupTournamentManager";
import AdminFinancialPage from "@/components/pages/admin/financial/FinancialPage";
import AdminSettingsPage from "@/components/pages/admin/settings/SettingsPage";
import MatchFormTab from "@/components/pages/admin/matches/MatchesPage";
import { useAuth } from "@/components/auth/AuthProvider";
import PlayerPage from "@/components/pages/admin/players/PlayerPage";

const Layout: React.FC = () => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("algemeen");
  const { user } = useAuth();

  const handleLogoClick = () => {
    setActiveTab("algemeen");
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  const handleLoginSuccess = () => {
    setLoginDialogOpen(false);
    // Tab wordt nu gezet in useEffect hieronder
  };

  // Zet juiste tab zodra user verandert na login
  useEffect(() => {
    if (!loginDialogOpen && user) {
      if (user.role === "admin") {
        setActiveTab("users");
      } else if (user.role === "player_manager") {
        setActiveTab("players");
      } else if (user.role === "referee") {
        setActiveTab("match-forms");
      } else {
        setActiveTab("algemeen");
      }
    }
  }, [user, loginDialogOpen]);

  // Main public tabs that use MainPages component
  const isMainTab = [
    "algemeen", "beker", "competitie", "playoff", 
    "schorsingen", "kaarten", "reglement", "teams"
  ].includes(activeTab);

  let content = null;

  if (isMainTab) {
    content = <MainPages activeTab={activeTab as any} setActiveTab={setActiveTab as any} />;
  } else {
    // Individual components for admin/user tabs with consistent padding
    switch (activeTab) {
      case "players":
        content = (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <PlayerPage />
          </div>
        );
        break;
      case "teams-admin":
        content = (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <AdminTeamPage />
          </div>
        );
        break;
      case "users":
        content = (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <AdminUserPage />
          </div>
        );
        break;
      case "competition":
        content = (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <AdminCompetitionPage />
          </div>
        );
        break;
      case "playoffs":
        content = (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <AdminPlayoffPage />
          </div>
        );
        break;
      case "cup":
        content = (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <CupTournamentManager />
          </div>
        );
        break;
      case "financial":
        content = (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <AdminFinancialPage />
          </div>
        );
        break;
      case "settings":
        content = (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <AdminSettingsPage />
          </div>
        );
        break;
      case "match-forms":
        content = (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <MatchFormTab teamId={0} teamName="Admin" />
          </div>
        );
        break;
      default:
        content = <MainPages activeTab="algemeen" setActiveTab={setActiveTab} />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-purple-100 text-foreground">
      <Header 
        onLogoClick={handleLogoClick} 
        onLoginClick={handleLoginClick}
        onTabChange={handleTabChange}
        activeTab={activeTab}
        isAuthenticated={!!user}
        user={user}
      />
      <main className="flex-1 w-full bg-purple-100 pt-6">
        {content}
      </main>
      <Footer />
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="w-full max-w-md mx-4 sm:mx-auto bg-background text-foreground border-border rounded-lg">
          <DialogTitle className="sr-only">Inloggen</DialogTitle>
          <DialogDescription className="sr-only">
            Log in op je account om toegang te krijgen tot het systeem
          </DialogDescription>
          <div className="rounded-b-lg">
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Layout;
