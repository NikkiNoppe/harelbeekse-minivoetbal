
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, User, LogOut, Settings, Shield, Users, Calendar, Trophy, Award, DollarSign, Home, BookOpen, Ban, AlertTriangle, Target } from "lucide-react";
import Logo from "./Logo";

interface HeaderProps {
  onLogoClick: () => void;
  onLoginClick: () => void;
  tabs?: { key: string; label: string; icon: React.ReactNode }[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onLogoClick, 
  onLoginClick, 
  tabs = [], 
  activeTab, 
  onTabChange 
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    onTabChange?.(tab);
    setIsSheetOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsSheetOpen(false);
  };

  // Admin navigation items
  const adminNavItems = [
    { key: "match-forms", label: "Wedstrijdformulieren", icon: <Calendar size={18} />, adminOnly: false },
    { key: "players", label: "Spelers", icon: <Users size={18} />, adminOnly: false },
    { key: "teams", label: "Teams", icon: <Shield size={18} />, adminOnly: true },
    { key: "users", label: "Gebruikers", icon: <User size={18} />, adminOnly: true },
    { key: "competition", label: "Competitie", icon: <Trophy size={18} />, adminOnly: true },
    { key: "cup", label: "Beker", icon: <Award size={18} />, adminOnly: true },
    { key: "financial", label: "Financieel", icon: <DollarSign size={18} />, adminOnly: true },
    { key: "settings", label: "Instellingen", icon: <Settings size={18} />, adminOnly: true }
  ];

  // Public navigation items
  const publicNavItems = [
    { key: "algemeen", label: "Algemeen", icon: <Home size={18} /> },
    { key: "beker", label: "Beker", icon: <Award size={18} /> },
    { key: "competitie", label: "Competitie", icon: <Trophy size={18} /> },
    { key: "playoff", label: "Play-off", icon: <Target size={18} /> },
    { key: "schorsingen", label: "Schorsingen", icon: <Ban size={18} /> },
    { key: "teams", label: "Teams", icon: <Shield size={18} /> },
    { key: "reglement", label: "Reglement", icon: <BookOpen size={18} /> }
  ];

  const isAdmin = user?.role === "admin";
  const visibleAdminItems = adminNavItems.filter(item => !item.adminOnly || isAdmin);
  const currentNavItems = isAuthenticated ? visibleAdminItems : publicNavItems;

  return (
    <header className="bg-gradient-to-r from-purple-900 to-purple-800 border-b border-purple-700 shadow-lg sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Logo onClick={onLogoClick} />
          </div>

          {/* Hamburger Menu for all screen sizes */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-white hover:bg-white/10 transition-all duration-200 hover:scale-105"
              >
                <Menu size={24} className="transition-transform duration-200" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-80 bg-gradient-to-b from-white to-gray-50 border-l border-purple-200 shadow-2xl"
            >
              <SheetHeader className="border-b border-gray-200 pb-6 mb-6">
                <SheetTitle className="text-2xl font-bold text-gray-900 text-left">
                  {isAuthenticated ? "Dashboard" : "Navigatie"}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6">
                {/* User Info Section */}
                {isAuthenticated && (
                  <div className="p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl shadow-sm border border-purple-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <User size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {user?.username || user?.email}
                        </p>
                        <p className="text-xs text-gray-600 bg-white/60 px-2 py-1 rounded-full inline-block mt-1">
                          {user?.role === "admin" ? "Administrator" : "Team Manager"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Items */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
                    Menu
                  </h3>
                  {currentNavItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleTabChange(item.key)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                        activeTab === item.key
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-[1.02]"
                          : "text-gray-700 hover:bg-gray-100 hover:shadow-md hover:transform hover:scale-[1.01]"
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-all duration-200 ${
                        activeTab === item.key 
                          ? "bg-white/20" 
                          : "bg-gray-200 group-hover:bg-gray-300"
                      }`}>
                        {React.cloneElement(item.icon as React.ReactElement, {
                          size: 18,
                          className: activeTab === item.key ? "text-white" : "text-gray-600"
                        })}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Action Buttons Section */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  {/* Login Button */}
                  {!isAuthenticated && (
                    <Button 
                      onClick={() => {
                        onLoginClick();
                        setIsSheetOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:transform hover:scale-[1.02]"
                    >
                      <User size={20} className="mr-2" />
                      Inloggen
                    </Button>
                  )}

                  {/* Logout Button */}
                  {isAuthenticated && (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-200 hover:shadow-md font-medium"
                    >
                      <LogOut size={18} />
                      <span>Uitloggen</span>
                    </button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
