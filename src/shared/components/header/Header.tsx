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
        <h3 className="text-lg font-semibold text-purple-800">Menu</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMenuOpen(false)}
          className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800"
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
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            size="lg"
          >
            Inloggen
          </Button>
        )}
      </div>
    </div>
  );
  
  return (
    <header className="w-full bg-purple-900 shadow-lg sticky top-0 z-50">
      <div className="w-full px-6 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <Logo onClick={onLogoClick} />
          </div>
          
          {/* Desktop Navigation */}
          {!isMobile ? (
            <div className="flex items-center space-x-8">
              <ThemeToggle />
              
              {isAuthenticated && user ? (
                <UserAccount user={user} onLogout={handleLogout} />
              ) : (
                <Button 
                  onClick={onLoginClick} 
                  className="bg-white text-purple-900 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg"
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
                  size="lg"
                  className="h-12 w-12 p-0 text-white hover:bg-white/10 rounded-lg"
                >
                  <Menu size={28} />
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
