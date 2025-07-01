
import React, { useState, lazy, Suspense } from "react";
import { AuthProvider } from "@features/auth/AuthProvider";
import { TabVisibilityProvider, TabName } from "@shared/context/TabVisibilityContext";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import MainTabs from "./tabs/MainTabs";

// Lazy load the LoginDialog to only load it when needed
const LoginDialog = lazy(() => import("@features/auth/LoginDialog"));

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
        <div className="min-h-screen bg-purple-50 flex flex-col">
          <Header onLogoClick={handleLogoClick} onLoginClick={handleLoginClick} />
          
          <main className="flex-1">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
              <MainTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </main>
          
          <Footer />
          
          {/* Only render LoginDialog when showLogin is true */}
          {showLogin && (
            <Suspense fallback={<div className="fixed inset-0 bg-black/20 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>}>
              <LoginDialog 
                isOpen={showLogin} 
                onClose={handleLoginClose}
              />
            </Suspense>
          )}
        </div>
      </TabVisibilityProvider>
    </AuthProvider>
  );
};

export default Layout;
