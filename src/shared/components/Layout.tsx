import React, { useState, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "@features/auth/AuthProvider";
import { TabVisibilityProvider, TabName } from "@shared/context/TabVisibilityContext";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import MainTabs from "./tabs/MainTabs";

// Lazy load components
const LoginDialog = lazy(() => import("@features/auth/LoginDialog"));
const MatchFormTab = lazy(() => import("@features/teams/MatchFormTab"));

const LayoutContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
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

  // Show match forms if user is authenticated
  const showMatchForms = isAuthenticated && user;

  return (
    <TabVisibilityProvider>
      <div className="min-h-screen bg-purple-50 flex flex-col">
        <Header onLogoClick={handleLogoClick} onLoginClick={handleLoginClick} />
        
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {showMatchForms ? (
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-purple-600">Wedstrijdformulieren laden...</span>
                </div>
              }>
                <MatchFormTab teamId={user?.teamId?.toString() || "1"} />
              </Suspense>
            ) : (
              <MainTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            )}
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
  );
};

const Layout: React.FC = () => {
  return (
    <AuthProvider>
      <LayoutContent />
    </AuthProvider>
  );
};

export default Layout;
