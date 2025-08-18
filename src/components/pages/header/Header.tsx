
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/components/pages/login/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, User, LogOut, Settings, Shield, Users, Calendar, Trophy, Award, DollarSign, Home, BookOpen, Ban, AlertTriangle, Target } from "lucide-react";
import Logo from "./Logo";
import { useTabVisibility } from "@/context/TabVisibilityContext";

interface HeaderProps {
  onLogoClick: () => void;
  onLoginClick: () => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
  isAuthenticated: boolean;
  user: any;
}

const Header: React.FC<HeaderProps> = ({ 
  onLogoClick, 
  onLoginClick,
  onTabChange,
  activeTab,
  isAuthenticated,
  user
}) => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth(); // <-- voeg logout toe
  const { isTabVisible } = useTabVisibility();

  // Route mapping per key (voor toekomstig onderscheid)
  const routeMap: Record<string, string> = {
    // Publiek
    algemeen: '/',
    beker: '/beker',
    competitie: '/competitie',
    playoff: '/playoff',
    teams: '/teams',
    reglement: '/reglement',
    kaarten: '/kaarten',
    // Admin
    'match-forms': '/match-forms',
    players: '/players',
    users: '/users',
    competition: '/competition',
    playoffs: '/playoffs',
    cup: '/cup',
    financial: '/financial',
    settings: '/settings',
  };

  const handleLogout = () => {
    setIsSheetOpen(false);
    logout(); // <-- roep de echte logout functie aan
  };

  // Admin navigation items
  const adminNavItems = [
    { key: "match-forms", label: "Wedstrijdformulieren", icon: <Calendar size={16} />, adminOnly: false },
    { key: "players", label: "Spelers", icon: <Users size={16} />, adminOnly: false },
    { key: "teams", label: "Teams", icon: <Shield size={16} />, adminOnly: true },
    { key: "users", label: "Gebruikers", icon: <User size={16} />, adminOnly: false },
    { key: "competition", label: "Competitie", icon: <Trophy size={16} />, adminOnly: true },
    { key: "cup", label: "Beker", icon: <Award size={16} />, adminOnly: true },
    { key: "financial", label: "Financieel", icon: <DollarSign size={16} />, adminOnly: true },
    { key: "settings", label: "Instellingen", icon: <Settings size={16} />, adminOnly: true }
  ];

  // Public navigation items
  const publicNavItems = [
    { key: "algemeen", label: "Algemeen", icon: <Home size={16} /> },
    { key: "beker", label: "Beker", icon: <Award size={16} /> },
    { key: "competitie", label: "Competitie", icon: <Trophy size={16} /> },
    { key: "playoff", label: "Play-off", icon: <Target size={16} /> },
    { key: "teams", label: "Teams", icon: <Shield size={16} /> },
    { key: "schorsingen", label: "Schorsingen", icon: <Ban size={16} /> },
    { key: "reglement", label: "Reglement", icon: <BookOpen size={16} /> }
  ];

  const isAdmin = user?.role === "admin";
  
  // Filter admin items based on visibility settings and admin permissions
  const visibleAdminItems = adminNavItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    
    // Check tab visibility for specific items
    switch (item.key) {
      case 'match-forms':
        return isTabVisible('match-forms');
      case 'competition':
        return isTabVisible('competition');
      case 'cup':
        return isTabVisible('cup');
      default:
        return true;
    }
  });
  
  // Filter public items based on tab visibility settings
  const visiblePublicItems = publicNavItems.filter(item => isTabVisible(item.key));

  // Always show public navigation in the navbar (visibility-controlled), even when authenticated
  const currentNavItems = visiblePublicItems;

  return (
    <header className="bg-purple-900 shadow-lg sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Sidebar Trigger */}
          <div className="flex items-center gap-3">
            {/* Sidebar Trigger - only show when authenticated (admin dashboard) */}
            {isAuthenticated && (
              <SidebarTrigger className="p-2 text-white hover:bg-purple-800 rounded-md transition-colors" />
            )}
            <Logo onClick={onLogoClick} />
          </div>

          {/* Hamburger Menu for all screen sizes */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-white bg-purple-200 hover:bg-purple-300/80 transition-all duration-200 hover:scale-105"
              >
                <Menu size={24} className="transition-transform duration-200 text-purple-900" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="navigation-modal w-80 bg-gradient-to-b from-white to-gray-50 border-l border-purple-200 shadow-2xl"
            >
              <SheetHeader className="border-b border-gray-200 pb-6 mb-6">
                <SheetTitle className="text-2xl font-bold text-purple-800 text-left">
                  {isAuthenticated ? "Dashboard" : "Navigatie"}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {isAuthenticated ? "Beheer je dashboard en navigeer door de applicatie" : "Navigeer door de verschillende secties van de website"}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
                {/* User Info Section */}
                {isAuthenticated && (
                  <button
                    type="button"
                    className="w-full p-4 bg-purple-200 rounded-xl shadow-sm border border-purple-200 text-left"
                    onClick={() => {
                      setIsSheetOpen(false);
                      onTabChange('players');
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-800 rounded-full flex items-center justify-center shadow-md">
                        <User size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-purple-900 text-sm">
                          {user?.username || user?.email}
                        </p>
                        <span className="text-xs text-purple-900 bg-white/80 px-2 py-1 rounded-full inline-block mt-1">
                          {user?.teamName ? user.teamName : 'Team Manager'}
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                {/* Navigation Items */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
                    Menu
                  </h3>
                  {currentNavItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setIsSheetOpen(false);
                        onTabChange(item.key);
                      }}
                      className={`btn-nav w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left font-medium${activeTab === item.key ? ' active' : ''}`}
                    >
                      {React.cloneElement(item.icon as React.ReactElement, {
                        size: 16,
                        className: "mr-2"
                      })}
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Action Buttons Section */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  {/* Login Button */}
                  {!isAuthenticated && (
                    <button
                      onClick={() => {
                        onLoginClick();
                        setIsSheetOpen(false);
                      }}
                      className="btn-nav active w-full"
                    >
                      <User size={16} className="mr-2" />
                      Inloggen
                    </button>
                  )}

                  {/* Logout Button */}
                  {isAuthenticated && (
                    <button
                      onClick={handleLogout}
                      className="btn-nav active w-full"
                    >
                      <LogOut size={16} className="mr-2" />
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
