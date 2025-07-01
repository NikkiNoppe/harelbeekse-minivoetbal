import React, { useState } from "react";
import { AuthProvider } from "@features/auth/AuthProvider";
import { TabVisibilityProvider, TabName } from "@shared/context/TabVisibilityContext";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import MainTabs from "./tabs/MainTabs";
import LoginDialog from "@features/auth/LoginDialog";

const Layout: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>("algemeen");

  const handleLogoClick = () => {
    setActiveTab("algemeen");
  };

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleLoginClose = () => {
    setShowLogin(false);
  };

  return (
    <AuthProvider>
      <TabVisibilityProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <Header onLogoClick={handleLogoClick} onLoginClick={handleLoginClick} />
          
          <main className="flex-1">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <MainTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </main>
          
          <Footer />
          
          <LoginDialog 
            isOpen={showLogin} 
            onClose={handleLoginClose}
          />
        </div>
      </TabVisibilityProvider>
    </AuthProvider>
  );
};

export default Layout;
