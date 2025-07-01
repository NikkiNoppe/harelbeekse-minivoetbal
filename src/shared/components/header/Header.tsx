import React, { useState } from "react";
import { cn } from "@shared/utils/utils";
import { useIsMobile } from "@shared/hooks/use-mobile";
import { useAuth } from "@features/auth/AuthProvider";
import UserAccount from "@features/auth/UserAccount";
import ThemeToggle from "@shared/components/theme/ThemeToggle";
import Logo from "@shared/components/header/Logo";
import { Menu, X, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@shared/components/ui/sheet";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";

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
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-800">Admin Dashboard</span>
              </div>
              <Badge className="bg-purple-600 text-white">Actief</Badge>
            </div>
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
    <header className={cn(
      "w-full shadow-sm sticky top-0 z-50 transition-colors duration-200",
      isAuthenticated 
        ? "bg-gradient-to-r from-purple-600 to-purple-800 border-b-2 border-purple-500" 
        : "bg-white border-b-2 border-purple-200"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <Logo onClick={onLogoClick} />
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-2">
                <Settings className="w-5 h-5 text-white" />
                <span className="text-white font-medium">Admin Dashboard</span>
                <Badge className="bg-white/20 text-white border-white/30">Actief</Badge>
              </div>
            )}
          </div>
          
          {/* Desktop Navigation */}
          {!isMobile ? (
            <div className="flex items-center space-x-6">
              <ThemeToggle />
              
              {isAuthenticated && user ? (
                <UserAccount user={user} onLogout={handleLogout} />
              ) : (
                <Button 
                  onClick={onLoginClick} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
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
                  className={cn(
                    "h-10 w-10 p-0 transition-colors duration-200",
                    isAuthenticated 
                      ? "text-white hover:bg-white/10" 
                      : "text-purple-600 hover:bg-purple-100"
                  )}
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
