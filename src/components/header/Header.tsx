
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/components/auth/AuthProvider";
import UserAccount from "@/components/auth/UserAccount";
import ThemeToggle from "@/components/theme/ThemeToggle";
import Logo from "@/components/header/Logo";
import MobileNavDropdown from "@/components/navigation/MobileNavDropdown";

interface HeaderProps {
  onLogoClick: () => void;
  onLoginClick: () => void;
  // Add support for tabs if needed
  tabs?: Array<{ key: string; label: string; icon: React.ReactNode }>;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onLogoClick, 
  onLoginClick,
  tabs = [],
  activeTab = "",
  onTabChange = () => {}
}) => {
  const isMobile = useIsMobile();
  const { user, logout, isAuthenticated } = useAuth();
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <header className="w-full py-4 px-4 sm:px-6 shadow-sm bg-purple-900 sticky top-0 z-30 border-b border-purple-800">
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
        <Logo onClick={onLogoClick} />
        
        <div className="flex items-center space-x-3">
          {/* Mobile Dropdown - shows when tabs are provided and on mobile */}
          {isMobile && tabs.length > 0 && (
            <MobileNavDropdown
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
              isAuthenticated={isAuthenticated}
              user={user}
              onLogin={onLoginClick}
              onLogout={handleLogout}
            />
          )}
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <>
              <ThemeToggle />
              
              {isAuthenticated && user ? (
                <UserAccount user={user} onLogout={handleLogout} />
              ) : (
                <button 
                  onClick={onLoginClick} 
                  className="px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors font-medium text-white bg-purple-800 hover:bg-purple-700 text-sm lg:text-base"
                >
                  Inloggen
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
