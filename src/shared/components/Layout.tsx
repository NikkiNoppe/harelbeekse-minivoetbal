import React, { useState, useEffect } from "react";
import { AuthProvider } from "@features/auth/AuthProvider";
import { TabVisibilityProvider, TabName } from "@shared/context/TabVisibilityContext";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import MainTabs from "./tabs/MainTabs";
import LoginDialog from "@features/auth/LoginDialog";

const Layout: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>("algemeen");

  useEffect(() => {
    // Show loading for 1 second as requested
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogoClick = () => {
    setActiveTab("algemeen");
  };

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleLoginClose = () => {
    setShowLogin(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-light to-purple-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-white">Harelbeekse Minivoetbal</h1>
          <p className="text-purple-100 text-lg">Welcome to the application!</p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

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
