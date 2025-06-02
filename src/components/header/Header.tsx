
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/components/auth/AuthProvider";
import UserAccount from "@/components/auth/UserAccount";
import ThemeToggle from "@/components/theme/ThemeToggle";
import Logo from "@/components/header/Logo";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HeaderProps {
  onLogoClick: () => void;
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick, onLoginClick }) => {
  const isMobile = useIsMobile();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
  };
  
  // Mobile menu content
  const MobileMenuContent = () => (
    <div className="flex flex-col space-y-4 p-4">
      <ThemeToggle />
      {isAuthenticated && user ? (
        <UserAccount user={user} onLogout={handleLogout} />
      ) : (
        <button 
          onClick={() => {
            onLoginClick();
            setIsMenuOpen(false);
          }} 
          className="w-full px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors font-medium text-white dark:text-slate-950 bg-orange-500 hover:bg-orange-400"
        >
          Inloggen
        </button>
      )}
    </div>
  );
  
  return (
    <header className="w-full py-4 px-6 shadow-md soccer-pattern sticky top-0 z-30">
      <div className="container flex justify-between items-center">
        <Logo onClick={onLogoClick} />
        
        {isMobile ? (
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 text-white rounded-md focus:outline-none">
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px]">
              <MobileMenuContent />
            </SheetContent>
          </Sheet>
        ) : (
          <div className={cn("flex items-center space-x-4")}>
            <ThemeToggle />
            
            {isAuthenticated && user ? (
              <UserAccount user={user} onLogout={handleLogout} />
            ) : (
              <button 
                onClick={onLoginClick} 
                className="px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors font-medium text-white dark:text-slate-950 bg-orange-500 hover:bg-orange-400"
              >
                Inloggen
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
