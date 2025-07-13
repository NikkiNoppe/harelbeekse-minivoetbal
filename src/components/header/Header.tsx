
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
    { key: "competition", label: "Competitiebeheer", icon: <Trophy size={18} />, adminOnly: true },
    { key: "cup", label: "Bekertoernooi", icon: <Award size={18} />, adminOnly: true },
    { key: "financial", label: "Financieel", icon: <DollarSign size={18} />, adminOnly: true },
    { key: "settings", label: "Instellingen", icon: <Settings size={18} />, adminOnly: true }
  ];

  // Public navigation items
  const publicNavItems = [
    { key: "algemeen", label: "Algemeen", icon: <Home size={18} /> },
    { key: "beker", label: "Beker", icon: <Award size={18} /> },
    { key: "competitie", label: "Competitie", icon: <Trophy size={18} /> },
    { key: "playoff", label: "Play-off", icon: <Target size={18} /> },
    { key: "reglement", label: "Reglement", icon: <BookOpen size={18} /> },
    { key: "schorsingen", label: "Schorsingen", icon: <Ban size={18} /> }
  ];

  const isAdmin = user?.role === "admin";
  const visibleAdminItems = adminNavItems.filter(item => !item.adminOnly || isAdmin);
  const currentNavItems = isAuthenticated ? visibleAdminItems : publicNavItems;

  return (
    <header className="bg-purple-900 border-b border-purple-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Logo onClick={onLogoClick} />
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center space-x-4">
              {/* Admin User Menu */}
              {isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-white hover:bg-purple-800">
                      <User size={16} />
                      <span className="hidden sm:inline">{user?.username || user?.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white border-purple-200 shadow-lg">
                    <div className="px-3 py-2 border-b border-purple-100">
                      <p className="text-sm font-medium text-purple-900">{user?.username || user?.email}</p>
                      <p className="text-xs text-purple-600">{user?.role === "admin" ? "Administrator" : "Team Manager"}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                      <LogOut size={16} />
                      <span>Uitloggen</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Login Button */}
              {!isAuthenticated && (
                <Button onClick={onLoginClick} variant="default" size="sm" className="bg-purple-800 hover:bg-purple-700 text-white">
                  Inloggen
                </Button>
              )}
            </div>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 text-white hover:bg-purple-800">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white border-l border-purple-200">
                <SheetHeader className="border-b border-purple-100 pb-4">
                  <SheetTitle className="text-purple-900">
                    {isAuthenticated ? "Admin Menu" : "Navigatie"}
                  </SheetTitle>
                </SheetHeader>

                <div className="py-4 space-y-2">
                  {/* User Info */}
                  {isAuthenticated && (
                    <div className="px-3 py-3 bg-purple-50 rounded-lg mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-purple-900">{user?.username || user?.email}</p>
                          <p className="text-sm text-purple-600">{user?.role === "admin" ? "Administrator" : "Team Manager"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Items */}
                  <div className="space-y-1">
                    {currentNavItems.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => handleTabChange(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                          activeTab === item.key
                            ? "bg-purple-100 text-purple-700 border-l-4 border-purple-600"
                            : "text-purple-700 hover:bg-purple-50"
                        }`}
                      >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Logout */}
                  {isAuthenticated && (
                    <>
                      <div className="border-t border-purple-100 my-4"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={18} />
                        <span className="font-medium">Uitloggen</span>
                      </button>
                    </>
                  )}

                  {/* Login */}
                  {!isAuthenticated && (
                    <>
                      <div className="border-t border-purple-100 my-4"></div>
                      <Button 
                        onClick={() => {
                          onLoginClick();
                          setIsSheetOpen(false);
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Inloggen
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
