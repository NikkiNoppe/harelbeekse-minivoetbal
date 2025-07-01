import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTabVisibility, TabName } from "@/context/TabVisibilityContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LoginForm from "@/components/auth/LoginForm";
import UserDashboard from "@/components/user/UserDashboard";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import MainTabs from "@/components/tabs/MainTabs";
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
  return <div className="min-h-screen flex flex-col bg-purple-100 text-foreground">
      {/* Header */}
      <Header onLogoClick={handleLogoClick} onLoginClick={handleLoginClick} />

      {/* Main Content - responsive container */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-7xl mx-auto bg-purple-100">
        {isAuthenticated && user ? <UserDashboard /> : <MainTabs activeTab={activeTab} setActiveTab={setActiveTab} />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="w-full max-w-md mx-4 sm:mx-auto bg-background text-foreground border-border">
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </DialogContent>
      </Dialog>
    </div>;
};
export default Layout;