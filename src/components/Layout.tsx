
import React, { useState, useEffect } from "react";
import Header from "@/components/pages/header/Header";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "@/components/pages/footer/Footer";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import LoginModal from "@/components/pages/login/LoginModal";
import MainPages from "@/components/pages/MainPages";
import { AdminDashboardLayout } from "@/components/pages/admin/AdminDashboardLayout";
import { useAuth } from "@/components/pages/login/AuthProvider";

const Layout: React.FC = () => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("financial");
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    setActiveTab("algemeen");
    try { navigate('/'); } catch (_) {}
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
      setActiveTab("match-forms");
    }
  }, [user, loginDialogOpen]);

  // Sync active tab with URL path for public sections
  useEffect(() => {
    const path = location.pathname;
    const map: Record<string, string> = {
      '/': 'algemeen',
      '/beker': 'beker',
      '/competitie': 'competitie',
      '/playoff': 'playoff',
      '/teams': 'ploegen',
      '/reglement': 'reglement',
      '/kaarten': 'kaarten',
      '/schorsingen': 'schorsingen',
    };
    const mapped = map[path];
    if (mapped) {
      setActiveTab(mapped);
    }
  }, [location.pathname]);

  // Admin sections die sidebar gebruiken
  const adminTabs = [
    "match-forms", "match-forms-league", "match-forms-cup", "match-forms-playoffs", "players", "teams", "users", 
    "competition", "playoffs", "cup", "financial", "settings", "schorsingen", "suspensions"
  ];
  
  // Main public tabs that use MainPages component
  const publicTabs = [
    "algemeen", "beker", "competitie", "playoff", 
    "kaarten", "schorsingen", "reglement", "teams", "ploegen"
  ];

  const isAdminSection = user && adminTabs.includes(activeTab);
  const isPublicSection = publicTabs.includes(activeTab);

  // Voorwaardelijke rendering: Sidebar voor admin, Header voor publiek
  if (isAdminSection) {
    return (
      <>
        <AdminDashboardLayout 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogoClick={handleLogoClick}
          onLoginClick={handleLoginClick}
        />
        <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
          <DialogContent className="modal">
            <DialogTitle className="sr-only">Inloggen</DialogTitle>
            <DialogDescription className="sr-only">
              Log in op je account om toegang te krijgen tot het systeem
            </DialogDescription>
            <LoginModal onLoginSuccess={handleLoginSuccess} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Publieke layout met Header hamburgermenu
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
        {isPublicSection ? (
          <MainPages activeTab={activeTab as any} setActiveTab={setActiveTab as any} />
        ) : (
          <MainPages activeTab="algemeen" setActiveTab={setActiveTab} />
        )}
      </main>
      <Footer />
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="modal">
          <DialogTitle className="sr-only">Inloggen</DialogTitle>
          <DialogDescription className="sr-only">
            Log in op je account om toegang te krijgen tot het systeem
          </DialogDescription>
          <LoginModal onLoginSuccess={handleLoginSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Layout;
