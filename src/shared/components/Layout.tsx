import React, { useState, useEffect } from "react";
import { AuthProvider } from "@features/auth/AuthProvider";
import { TabVisibilityProvider, TabName } from "@shared/context/TabVisibilityContext";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import MainTabs from "./tabs/MainTabs";
import LoginForm from "@features/auth/LoginForm";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto p-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Harelbeekse Minivoetbal</h1>
          <p>Welcome to the application!</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <TabVisibilityProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <Header onLogoClick={handleLogoClick} onLoginClick={handleLoginClick} />
          
          <main className="flex-1 container mx-auto p-4">
            <MainTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </main>
          
          <Footer />
          
          {showLogin && (
            <LoginForm 
              isOpen={showLogin} 
              onClose={handleLoginClose}
            />
          )}
        </div>
      </TabVisibilityProvider>
    </AuthProvider>
  );
};

export default Layout;
