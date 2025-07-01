import React, { useState } from "react";
import { cn } from "@shared/utils/utils";
import { useIsMobile } from "@shared/hooks/use-mobile";
import { useAuth } from "@features/auth/AuthProvider";
import UserAccount from "@features/auth/UserAccount";
import ThemeToggle from "@shared/components/theme/ThemeToggle";
import Logo from "@shared/components/header/Logo";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@shared/components/ui/sheet";
import { Button } from "@shared/components/ui/button";

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
    setIsMenuOpen(false);
  };
  
  // Mobile menu content
  const MobileMenuContent = () => (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex items-center justify-between pb-4 border-b border-purple-200">
        <h3 className="text-lg font-semibold text-purple-dark">Menu</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMenuOpen(false)}
          className="h-8 w-8 p-0"
        >
          <X size={20} />
        </Button>
      </div>
      
      <div className="space-y-4">
        <ThemeToggle />
        
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <UserAccount user={user} onLogout={handleLogout} />
          </div>
        ) : (
          <Button 
            onClick={() => {
              onLoginClick();
              setIsMenuOpen(false);
            }} 
            className="w-full bg-purple-dark hover:bg-purple-700 text-white"
            size="lg"
          >
            Inloggen
          </Button>
        )}
      </div>
    </div>
  );
  
  return (
    <header className="w-full bg-gradient-to-r from-purple-dark to-purple-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo onClick={onLogoClick} />
          </div>
          
          {/* Desktop Navigation */}
          {!isMobile ? (
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              {isAuthenticated && user ? (
                <UserAccount user={user} onLogout={handleLogout} />
              ) : (
                <Button 
                  onClick={onLoginClick} 
                  variant="secondary"
                  className="bg-white hover:bg-purple-50 text-purple-dark hover:text-purple-800 transition-all duration-200 font-medium px-6"
                >
                  Inloggen
                </Button>
              )}
            </div>
          ) : (
            /* Mobile Menu Button */
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-10 w-10 p-0 text-white hover:bg-white/10 focus:bg-white/10"
                >
                  <Menu size={24} />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[320px] bg-white border-l border-purple-200"
              >
                <MobileMenuContent />
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

