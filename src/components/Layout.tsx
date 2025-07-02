import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTabVisibility, TabName } from "@/context/TabVisibilityContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LoginForm from "@/components/auth/LoginForm";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import MainTabs from "@/components/tabs/MainTabs";
import ModernUserDashboard from "@/components/user/ModernUserDashboard";

const Layout: React.FC = () => {
  const {
    user,
    logout,
    isAuthenticated
  } = useAuth();
  const {
    isTabVisible
  } = useTabVisibility();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>("algemeen");

  const handleLogoClick = () => {
    setActiveTab("algemeen");
  };
  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };
  const handleLoginSuccess = () => {
    setLoginDialogOpen(false);
  };
  const handleLogout = () => {
    logout();
  };

  // Set the first visible tab as active tab when loading
  useEffect(() => {
    const visibleTabs: TabName[] = ["algemeen", "competitie", "playoff", "beker", "schorsingen", "reglement"].filter(tab => isTabVisible(tab as TabName)) as TabName[];
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [isTabVisible, activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-purple-100 text-foreground">
      {/* Header */}
      <Header onLogoClick={handleLogoClick} onLoginClick={handleLoginClick} />

      {/* Main Content - full width with modern tabs */}
      <main className="flex-1 w-full bg-purple-100">
        {isAuthenticated && user ? (
          <ModernUserDashboard />
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
