import React, { useState, useEffect } from "react";
import Header from "@/components/pages/header/Header";
import Footer from "@/components/pages/footer/Footer";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import LoginModal from "@/components/pages/login/LoginModal";
import MainPages from "@/components/pages/MainPages";
import AdminDashboard from "@/components/pages/admin/AdminDashboard";
import { useAuth } from "@/components/pages/login/AuthProvider";

const Layout: React.FC = () => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("financial");
  const { user } = useAuth();

  const handleLogoClick = () => {
    setActiveTab("match-forms");
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

  // Main public tabs that use MainPages component
  const isMainTab = [
    "algemeen", "beker", "competitie", "playoff", 
    "schorsingen", "kaarten", "reglement", "teams"
  ].includes(activeTab);

  // Check if it's an admin tab
  const isAdminTab = [
    "match-forms", "players", "teams", "users", "competition", 
    "playoffs", "cup", "financial", "settings", "speelformat"
  ].includes(activeTab);

  // Determine which content to render
  let content = null;
  
  if (isMainTab) {
    content = <MainPages activeTab={activeTab as any} setActiveTab={setActiveTab as any} />;
  } else if (isAdminTab) {
    content = <AdminDashboard activeTab={activeTab as any} setActiveTab={setActiveTab as any} />;
  } else {
    content = <MainPages activeTab="algemeen" setActiveTab={setActiveTab} />;
  }

  // Determine if we should show the public header and footer
  const showPublicLayout = !isAdminTab;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {showPublicLayout && (
        <Header 
          onLogoClick={handleLogoClick} 
          onLoginClick={handleLoginClick}
          onTabChange={handleTabChange}
          activeTab={activeTab}
          isAuthenticated={!!user}
          user={user}
        />
      )}
      <main className={`flex-1 w-full ${showPublicLayout ? 'bg-purple-100 pt-6' : ''}`}>
        {content}
      </main>
      {showPublicLayout && <Footer />}
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