
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTabVisibility, TabName } from "@/context/TabVisibilityContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate, useLocation } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import UserDashboard from "@/components/user/UserDashboard";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import MainTabs from "@/components/tabs/MainTabs";

const Layout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isTabVisible } = useTabVisibility();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>("algemeen");
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogoClick = () => {
    setActiveTab("algemeen");
    navigate("/");
  };

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  const handleLoginSuccess = () => {
    setLoginDialogOpen(false);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Set the first visible tab as active tab when loading
  useEffect(() => {
    const visibleTabs: TabName[] = [
      "algemeen", "competitie", "playoff", "beker", "schorsingen", "reglement"
    ].filter(tab => isTabVisible(tab as TabName)) as TabName[];
    
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [isTabVisible, activeTab]);

  // Show UserDashboard when on /dashboard route and authenticated
  const showUserDashboard = location.pathname === "/dashboard" && isAuthenticated && user;
  
  // Show MainTabs when on root route or when not authenticated
  const showMainTabs = location.pathname === "/" || !isAuthenticated;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <Header 
        onLogoClick={handleLogoClick}
        onLoginClick={handleLoginClick}
      />

      {/* Main Content */}
      <main className="flex-1 container py-6">
        {showUserDashboard ? (
          <UserDashboard />
        ) : showMainTabs ? (
          <MainTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        ) : null}
      </main>

      {/* Footer */}
      <Footer />

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background text-foreground border-border">
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Layout;
