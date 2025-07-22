
import React, { useState } from "react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import LoginForm from "@/components/auth/LoginForm";
import AlgemeenTab from "@/components/tabs/AlgemeenTab";
import BekerTab from "@/components/tabs/BekerTab";
import CompetitieTab from "@/components/tabs/CompetitieTab";
import PlayOffTab from "@/components/tabs/PlayOffTab";
import SchorsingenTab from "@/components/tabs/SchorsingenTab";
import KaartenTab from "@/components/tabs/KaartenTab";
import ReglementTab from "@/components/tabs/ReglementTab";
import TeamsTab from "@/components/tabs/TeamsTab";
import PlayersTab from "@/components/user/tabs/PlayersTab";
import TeamsAdminTab from "@/components/admin/tabs/TeamsTab";
import UserManagementTab from "@/components/admin/tabs/UserManagementTab";
import CompetitionManagementTab from "@/components/admin/tabs/CompetitionManagementTab";
import PlayoffManagementTab from "@/components/admin/tabs/PlayoffManagementTab";
import CupTournamentManager from "@/components/admin/CupTournamentManager";
import FinancialTabUpdated from "@/components/admin/tabs/FinancialTabUpdated";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";
import MatchFormTab from "@/components/team/MatchFormTab";

const Layout: React.FC = () => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("algemeen");

  const handleLogoClick = () => {
    setActiveTab("algemeen");
  };

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  const handleLoginSuccess = () => {
    setLoginDialogOpen(false);
  };

  let content = null;
  switch (activeTab) {
    case "algemeen":
      content = <AlgemeenTab />;
      break;
    case "beker":
      content = <BekerTab />;
      break;
    case "competitie":
      content = <CompetitieTab />;
      break;
    case "playoff":
      content = <PlayOffTab />;
      break;
    case "schorsingen":
      content = <SchorsingenTab />;
      break;
    case "kaarten":
      content = <KaartenTab />;
      break;
    case "reglement":
      content = <ReglementTab />;
      break;
    case "teams":
      content = <TeamsTab />;
      break;
    case "players":
      content = <PlayersTab />;
      break;
    case "teams-admin":
      content = <TeamsAdminTab />;
      break;
    case "users":
      content = <UserManagementTab />;
      break;
    case "competition":
      content = <CompetitionManagementTab />;
      break;
    case "playoffs":
      content = <PlayoffManagementTab />;
      break;
    case "cup":
      content = <CupTournamentManager />;
      break;
    case "financial":
      content = <FinancialTabUpdated />;
      break;
    case "settings":
      content = <AdminSettingsPanel />;
      break;
    case "match-forms":
      content = <MatchFormTab teamId={0} teamName="Admin" />;
      break;
    default:
      content = <AlgemeenTab />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-purple-100 text-foreground">
      <Header 
        onLogoClick={handleLogoClick} 
        onLoginClick={handleLoginClick}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        isAuthenticated={false}
        user={null}
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
