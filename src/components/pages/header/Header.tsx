
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/components/pages/login/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, User, LogOut, Settings, Shield, Users, Calendar, Trophy, Award, DollarSign, Home, BookOpen, Ban, AlertTriangle, Target } from "lucide-react";
import HamburgerIcon from "@/components/ui/HamburgerIcon";
import Logo from "./Logo";
import { useTabVisibility } from "@/context/TabVisibilityContext";
import { PUBLIC_ROUTES, ADMIN_ROUTES, getPathFromTab } from "@/config/routes";

interface HeaderProps {
  onLogoClick: () => void;
  onLoginClick: () => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
  isAuthenticated: boolean;
  user: any;
  hasSidebar?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onLogoClick, 
  onLoginClick,
  onTabChange,
  activeTab,
  isAuthenticated,
  user,
  hasSidebar = false
}) => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth(); // <-- voeg logout toe
  const { isTabVisible } = useTabVisibility();

  const handleLogoClick = useCallback(() => {
    try {
      onLogoClick();
    } catch (_) {}
    navigate(PUBLIC_ROUTES.algemeen);
  }, [onLogoClick, navigate]);

  /**
   * Route mapping for tab navigation
   * Maps tab keys to their corresponding URL paths
   */
  const routeMap: Record<string, string> = {
    // Publiek
    algemeen: PUBLIC_ROUTES.algemeen,
    beker: PUBLIC_ROUTES.beker,
    competitie: PUBLIC_ROUTES.competitie,
    playoff: PUBLIC_ROUTES.playoff,
    teams: PUBLIC_ROUTES.teams,
    reglement: PUBLIC_ROUTES.reglement,
    kaarten: PUBLIC_ROUTES.kaarten,
    scheidsrechters: PUBLIC_ROUTES.scheidsrechters,
    // Admin
    'match-forms': ADMIN_ROUTES['match-forms'],
    'match-forms-league': ADMIN_ROUTES['match-forms-league'],
    'match-forms-cup': ADMIN_ROUTES['match-forms-cup'],
    'match-forms-playoffs': ADMIN_ROUTES['match-forms-playoffs'],
    players: ADMIN_ROUTES.players,
    users: ADMIN_ROUTES.users,
    competition: ADMIN_ROUTES.competition,
    playoffs: ADMIN_ROUTES.playoffs,
    cup: ADMIN_ROUTES.cup,
    financial: ADMIN_ROUTES.financial,
    settings: ADMIN_ROUTES.settings,
    'admin-scheidsrechters': ADMIN_ROUTES.scheidsrechters,
  };

  const handleLogout = () => {
    setIsSheetOpen(false);
    logout(); // <-- roep de echte logout functie aan
  };

  // Public navigation items
  const publicNavItems = [
    { key: "algemeen", label: "Algemeen", icon: <Home size={16} /> },
    { key: "reglement", label: "Reglement", icon: <BookOpen size={16} /> },
    { key: "competitie", label: "Competitie", icon: <Trophy size={16} /> },
    { key: "beker", label: "Beker", icon: <Award size={16} /> },
    { key: "playoff", label: "Play-off", icon: <Target size={16} /> },
  ];

  const normalizedRole = String(user?.role || '').toLowerCase();
  const isAdmin = normalizedRole === "admin";
  const roleLabel = isAdmin
    ? 'Administrator'
    : normalizedRole === 'referee'
    ? 'Scheidsrechter'
    : normalizedRole === 'player_manager'
    ? 'Team Manager'
    : 'Gebruiker';

  // Filter public items based on tab visibility settings and enforce desired order
  const desiredPublicOrder = ['algemeen', 'reglement', 'competitie', 'beker'] as const;
  const visiblePublicItems = desiredPublicOrder
    .map((key) => publicNavItems.find((i) => i.key === key))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))
    .filter((item) => isTabVisible(item.key));

  // Admin groups (mirrors AdminSidebar)
  const speelformatenItems = [
    { key: "competition", label: "Competitie", icon: <Trophy size={14} /> },
    { key: "cup", label: "Beker", icon: <Award size={14} /> },
    { key: "playoffs", label: "Playoff", icon: <Target size={14} /> },
  ];

  const wedstrijdformulierenItems = [
    { key: "match-forms-league", label: "Competitie", icon: <Trophy size={14} />, adminOnly: false },
    { key: "match-forms-cup", label: "Beker", icon: <Award size={14} />, adminOnly: false },
    { key: "match-forms-playoffs", label: "Play-Off", icon: <Target size={14} />, adminOnly: true },
  ];

  const beheerItems = [
    { key: "players", label: "Spelers", icon: <Users size={14} />, adminOnly: false },
    { key: "scheidsrechters", label: "Scheidsrechters", icon: <Shield size={14} />, adminOnly: false },
    { key: "schorsingen", label: "Mijn Schorsingen", icon: <Ban size={14} />, adminOnly: false, teamManagerOnly: true },
    { key: "suspensions", label: "Schorsingen", icon: <Shield size={14} />, adminOnly: true },
    { key: "teams", label: "Teams (Admin)", icon: <Shield size={14} />, adminOnly: true },
    { key: "users", label: "Gebruikers", icon: <User size={14} />, adminOnly: true },
  ];

  const financieelItems = [
    { key: "financial", label: "Financieel", icon: <DollarSign size={14} />, adminOnly: true },
  ];

  const systeemItems = [
    { key: "settings", label: "Instellingen", icon: <Settings size={14} />, adminOnly: true },
    { key: "blog-management", label: "Blog Beheer", icon: <BookOpen size={14} />, adminOnly: true },
    { key: "notification-management", label: "Notificaties", icon: <AlertTriangle size={14} />, adminOnly: true },
  ];

  // Visibility filtering similar to AdminSidebar
  const visibleSpeelformatenItems = isAuthenticated && isAdmin ? speelformatenItems : [];
  const visibleWedstrijdformulierenItems = isAuthenticated ? wedstrijdformulierenItems.filter(item => 
    (!item.adminOnly || isAdmin) && isTabVisible(item.key)
  ) : [];
  const visibleBeheerItems = (isAuthenticated ? beheerItems : [])
    .filter(item => (!item.adminOnly || isAdmin) && 
      // Show scheidsrechters for both admin and referee
      (item.key !== 'scheidsrechters' || isAdmin || normalizedRole === 'referee') &&
      // Show schorsingen for team managers only
      (item.key !== 'schorsingen' || normalizedRole === 'player_manager'));
  const visibleFinancieelItems = (isAuthenticated ? financieelItems : [])
    .filter(item => (!item.adminOnly || isAdmin));
  const visibleSysteemItems = (isAuthenticated ? systeemItems : [])
    .filter(item => (!item.adminOnly || isAdmin));

  return (
    <header className="bg-purple-900 shadow-lg sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo and Sidebar Trigger */}
          <div className="flex items-center gap-3">
            {/* Sidebar Trigger - only show when authenticated and within SidebarProvider */}
            {isAuthenticated && hasSidebar && (
              <SidebarTrigger className="p-2 rounded-md transition-all sidebar-trigger" />
            )}
          </div>

          {/* Centered Logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Logo onClick={handleLogoClick} />
          </div>

          {/* Hamburger Menu for all screen sizes */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-white bg-purple-200 hover:bg-purple-300/80 transition-all duration-200 hover:scale-105"
                aria-label="Open navigatiemenu"
              >
                <HamburgerIcon className="transition-transform duration-200 text-purple-900" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="navigation-modal w-80 bg-gradient-to-b from-white to-gray-50 border-l border-purple-200 shadow-2xl flex flex-col"
            >
              <SheetHeader className="border-b border-gray-200 pb-6 mb-6 flex-shrink-0">
                <SheetTitle className="text-2xl font-bold text-purple-800 text-left">
                  {isAuthenticated ? "Dashboard" : "Navigatie"}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {isAuthenticated ? "Beheer je dashboard en navigeer door de applicatie" : "Navigeer door de verschillende secties van de website"}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide pb-24">
                {/* User Info Section */}
                {isAuthenticated && (
                  <button
                    type="button"
                    className="w-full p-4 bg-purple-200 rounded-xl shadow-sm border border-purple-200 text-left"
                    onClick={() => {
                      setIsSheetOpen(false);
                      navigate(ADMIN_ROUTES.players);
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
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                {/* Public Navigation Items */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                    Menu
                  </h3>
                  {visiblePublicItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setIsSheetOpen(false);
                        // Navigate to URL for public tabs
                        const path = routeMap[item.key] || getPathFromTab(item.key);
                        navigate(path);
                      }}
                      className={`btn-nav w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm${activeTab === item.key ? ' active' : ''}`}
                    >
                      {React.cloneElement(item.icon as React.ReactElement, {
                        size: 14,
                        className: "mr-2"
                      })}
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Admin Groups when authenticated */}
                {isAuthenticated && (
                  <div className="space-y-4">
                    {visibleWedstrijdformulierenItems.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Wedstrijdformulieren</h3>
                        {visibleWedstrijdformulierenItems.map((item) => (
                          <button
                            key={item.key}
                            onClick={() => { 
                              setIsSheetOpen(false); 
                              const path = routeMap[item.key] || getPathFromTab(item.key);
                              navigate(path);
                            }}
                            className={`btn-nav w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm${activeTab === item.key ? ' active' : ''}`}
                          >
                            {React.cloneElement(item.icon as React.ReactElement, { className: "mr-2" })}
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {visibleBeheerItems.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Beheer</h3>
                        {visibleBeheerItems.map((item) => (
                          <button
                            key={item.key}
                            onClick={() => {
                              setIsSheetOpen(false);
                              const path = routeMap[item.key] || getPathFromTab(item.key);
                              navigate(path);
                            }}
                            className={`btn-nav w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm${activeTab === item.key ? ' active' : ''}`}
                          >
                            {React.cloneElement(item.icon as React.ReactElement, { className: "mr-2" })}
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {visibleFinancieelItems.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Financieel</h3>
                        {visibleFinancieelItems.map((item) => (
                          <button
                            key={item.key}
                            onClick={() => { 
                              setIsSheetOpen(false); 
                              const path = routeMap[item.key] || getPathFromTab(item.key);
                              navigate(path);
                            }}
                            className={`btn-nav w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm${activeTab === item.key ? ' active' : ''}`}
                          >
                            {React.cloneElement(item.icon as React.ReactElement, { className: "mr-2" })}
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {visibleSpeelformatenItems.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Speelformaten</h3>
                        {visibleSpeelformatenItems.map((item) => (
                          <button
                            key={item.key}
                            onClick={() => { 
                              setIsSheetOpen(false); 
                              const path = routeMap[item.key] || getPathFromTab(item.key);
                              navigate(path);
                            }}
                            className={`btn-nav w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm${activeTab === item.key ? ' active' : ''}`}
                          >
                            {React.cloneElement(item.icon as React.ReactElement, { className: "mr-2" })}
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {visibleSysteemItems.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Systeem</h3>
                        {visibleSysteemItems.map((item) => (
                          <button
                            key={item.key}
                            onClick={() => { 
                              setIsSheetOpen(false); 
                              const path = routeMap[item.key] || getPathFromTab(item.key);
                              navigate(path);
                            }}
                            className={`btn-nav w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm${activeTab === item.key ? ' active' : ''}`}
                          >
                            {React.cloneElement(item.icon as React.ReactElement, { className: "mr-2" })}
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fixed bottom action bar */}
              <div className="p-3 sticky bottom-0 bg-transparent">
                {!isAuthenticated ? (
                  <button
                    onClick={() => { onLoginClick(); setIsSheetOpen(false); }}
                    className="btn-nav active w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm"
                  >
                    <User size={16} className="mr-1" />
                    Inloggen
                  </button>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="btn-nav active w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm"
                  >
                    <LogOut size={16} className="mr-1" />
                    <span>Uitloggen</span>
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
