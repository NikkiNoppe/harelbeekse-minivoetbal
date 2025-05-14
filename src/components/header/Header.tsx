
import React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/components/auth/AuthProvider";
import UserAccount from "@/components/auth/UserAccount";
import ThemeToggle from "@/components/theme/ThemeToggle";
import Logo from "@/components/header/Logo";

interface HeaderProps {
  onLogoClick: () => void;
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick, onLoginClick }) => {
  const isMobile = useIsMobile();
  const { user, logout, isAuthenticated } = useAuth();
  
  return (
    <header className="w-full py-4 px-6 shadow-md soccer-pattern">
      <div className="container flex justify-between items-center">
        <Logo onClick={onLogoClick} />
        
        <div className={cn("flex items-center space-x-4", isMobile ? "flex" : "hidden md:flex")}>
          <ThemeToggle />
          
          {isAuthenticated && user ? (
            <UserAccount user={user} onLogout={logout} />
          ) : (
            <button 
              onClick={onLoginClick} 
              className="px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors font-medium text-white dark:text-slate-950 bg-orange-500 hover:bg-orange-400"
            >
              Inloggen
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
