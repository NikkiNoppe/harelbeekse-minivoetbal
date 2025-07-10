
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTabVisibility, TabName } from "@/context/TabVisibilityContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Home, Award, Trophy, Target, BookOpen, Ban, AlertTriangle, Calendar, Users, Shield, UserIcon, DollarSign, Settings } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import MainTabs from "@/components/tabs/MainTabs";
import AdminDashboard from "@/components/user/AdminDashboard";

type AdminTabName = "match-forms" | "players" | "teams" | "users" | "competition" | "financial" | "settings" | "cup";

const Layout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isTabVisible } = useTabVisibility();
  const isMobile = useIsMobile();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>("algemeen");
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabName>("match-forms");

  const handleLogoClick = () => {
    if (isAuthenticated) {
      setActiveAdminTab("match-forms");
    } else {
      setActiveTab("algemeen");
    }
  };
  
  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };
  
  const handleLoginSuccess = () => {
    setLoginDialogOpen(false);
  };

  // Handle tab changes from mobile dropdown
  const handleTabChange = (tab: string) => {
    console.log("Tab change requested:", tab);
    
    if (isAuthenticated) {
      // Admin tabs
      if (["match-forms", "players", "teams", "users", "competition", "financial", "settings", "cup"].includes(tab)) {
        setActiveAdminTab(tab as AdminTabName);
      }
    } else {
      // Public tabs
      if (["algemeen", "beker", "competitie", "playoff", "reglement", "schorsingen", "kaarten"].includes(tab)) {
        setActiveTab(tab as TabName);
      }
    }
  };

  // Set the first visible tab as active tab when loading
  useEffect(() => {
    if (!isAuthenticated) {
      const visibleTabs: TabName[] = ["algemeen", "competitie", "playoff", "beker", "schorsingen", "reglement"].filter(tab => isTabVisible(tab as TabName)) as TabName[];
      if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
        setActiveTab(visibleTabs[0]);
      }
    }
  }, [isTabVisible, activeTab, isAuthenticated]);

  // Prepare tabs for mobile navigation
  const getTabsForMobile = () => {
    if (isAuthenticated && user) {
      // Admin/Team tabs
      const isAdmin = user.role === "admin";
      const adminTabs = [
        { key: "match-forms", label: "Wedstrijdformulieren", icon: <Calendar size={16} /> },
        { key: "players", label: "Spelers", icon: <Users size={16} /> },
        ...(isAdmin ? [
          { key: "teams", label: "Teams", icon: <Shield size={16} /> },
          { key: "users", label: "Gebruikers", icon: <UserIcon size={16} /> },
          { key: "competition", label: "Competitiebeheer", icon: <Trophy size={16} /> },
          { key: "cup", label: "Bekertoernooi", icon: <Award size={16} /> },
          { key: "financial", label: "Financieel", icon: <DollarSign size={16} /> },
          { key: "settings", label: "Instellingen", icon: <Settings size={16} /> }
        ] : [])
      ];
      return adminTabs;
    } else {
      // Public tabs
      const publicTabs = [
        { key: "algemeen", label: "Algemeen", icon: <Home size={16} /> },
        { key: "beker", label: "Beker", icon: <Award size={16} /> },
        { key: "competitie", label: "Competitie", icon: <Trophy size={16} /> },
        { key: "playoff", label: "Play-off", icon: <Target size={16} /> },
        { key: "reglement", label: "Reglement", icon: <BookOpen size={16} /> },
        { key: "schorsingen", label: "Schorsingen", icon: <Ban size={16} /> },
        { key: "kaarten", label: "Kaarten", icon: <AlertTriangle size={16} /> }
      ];
      return publicTabs.filter(tab => isTabVisible(tab.key as TabName));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-purple-100 text-foreground">
      {/* Header with mobile navigation support */}
      <Header 
        onLogoClick={handleLogoClick} 
        onLoginClick={handleLoginClick}
        tabs={isMobile ? getTabsForMobile() : []}
        activeTab={isAuthenticated ? activeAdminTab : activeTab}
        onTabChange={handleTabChange}
      />

      {/* Main Content - full width with modern tabs */}
      <main className="flex-1 w-full bg-purple-100">
        {isAuthenticated && user ? (
          <AdminDashboard activeTab={activeAdminTab} setActiveTab={setActiveAdminTab} />
        ) : (
          <MainTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="w-full max-w-md mx-4 sm:mx-auto bg-background text-foreground border-border rounded-lg">
          <DialogTitle className="sr-only">Inloggen</DialogTitle>
          <div className="rounded-b-lg">
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Layout;
