import React from "react";
import { Calendar, Trophy, Award, Target, Users, Shield, User, DollarSign, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/components/pages/login/AuthProvider";
import { useSidebar } from "@/components/ui/sidebar";
import { useTabVisibility } from "@/context/TabVisibilityContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const normalizedRole = String(user?.role || '').toLowerCase();
  const isAdmin = normalizedRole === "admin";
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isTabVisible } = useTabVisibility();
  const isMobile = useIsMobile();


  // Wedstrijdformulieren groep
  const wedstrijdformulierenItems = [
    { key: "match-forms-league", label: "Competitie", icon: Trophy, adminOnly: false },
    { key: "match-forms-cup", label: "Beker", icon: Award, adminOnly: false },
    { key: "match-forms-playoffs", label: "Play-Off", icon: Target, adminOnly: true },
  ];

  // Beheer groep
  const beheerItems = [
    { key: "players", label: "Spelers", icon: Users, adminOnly: false },
    { key: "suspensions", label: "Schorsingen", icon: Shield, adminOnly: true },
    { key: "teams", label: "Teams", icon: Shield, adminOnly: true },
    { key: "users", label: "Gebruikers", icon: User, adminOnly: true },
  ];

  // Financieel groep
  const financieelItems = [
    { key: "financial", label: "Financieel", icon: DollarSign, adminOnly: true },
  ];
  // Speelformaten groep (uitklapbaar) - alleen voor admin
  const speelformatenItems = [
    { key: "competition", label: "Competitie", icon: Trophy },
    { key: "cup", label: "Beker", icon: Award },
    { key: "playoffs", label: "Playoff", icon: Target },
  ];
  
  // Systeem groep
  const systeemItems = [
    { key: "settings", label: "Instellingen", icon: Settings, adminOnly: true },
  ];

  const isActive = (key: string) => activeTab === key;

  const renderMenuItem = (item: any) => (
    <div key={item.key} className="mb-1">
      <button
        onClick={() => onTabChange(item.key)}
        className={`btn-nav w-full flex items-center ${collapsed ? 'justify-center p-2' : 'justify-start gap-2 px-4 py-3'} ${isActive(item.key) ? ' active' : ''} bg-transparent text-white`}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span className="text-sm">{item.label}</span>}
      </button>
    </div>
  );

  const renderGroup = (title: string, items: any[]) => {
    // Don't render empty groups
    if (items.length === 0) return null;
    
    return (
      <div className="mb-3">
        {!collapsed && (
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-1.5">
            {title}
          </h3>
        )}
        <div className="space-y-0.5">
          {items.map(renderMenuItem)}
        </div>
      </div>
    );
  };

  // Filter items based on tab visibility and admin permissions
  // Speelformaten zijn pure beheertabs: voor admins altijd zichtbaar, onafhankelijk van publieke tab-zichtbaarheid
  const visibleSpeelformatenItems = speelformatenItems.filter(() => isAdmin);

  // Wedstrijdformulieren: filter op basis van tab visibility en admin permissions
  const visibleWedstrijdformulierenItems = wedstrijdformulierenItems.filter(item => 
    (!item.adminOnly || isAdmin) && isTabVisible(item.key)
  );

  const visibleBeheerItems = beheerItems.filter(item => 
    (!item.adminOnly || isAdmin) && 
    // Hide players tab for referees
    !(item.key === 'players' && user?.role === 'referee')
  );

  const visibleFinancieelItems = financieelItems.filter(item => 
    (!item.adminOnly || isAdmin)
  );

  const visibleSysteemItems = systeemItems.filter(item => 
    (!item.adminOnly || isAdmin)
  );

  return (
    <div 
      className={`${collapsed ? "w-14" : "w-64"} flex flex-col h-full ${isMobile ? 'px-4 py-6' : 'p-3'}`}
      style={{ background: 'var(--purple-100)' }}
    >
      {/* Header bovenaan: toon rol van ingelogde gebruiker */}
      <div className="mb-6">
        {collapsed ? (
          <div className="flex items-center justify-center">
            <Shield className="h-4 w-4" style={{ color: 'var(--main-color-dark)' }} />
          </div>
        ) : (
          <div className={`${isMobile ? 'px-2' : 'px-1'}`}>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--main-color-dark)' }}>
              {isAdmin
                ? 'ADMIN'
                : normalizedRole === 'referee'
                ? 'SCHEIDSRECHTER'
                : normalizedRole === 'player_manager'
                ? 'TEAM MANAGER'
                : normalizedRole
                ? normalizedRole.toUpperCase()
                : 'GEBRUIKER'}
            </div>
            <div className="text-base font-semibold" style={{ color: 'var(--main-color-dark)' }}>
              {isAdmin
                ? 'Administrator'
                : normalizedRole === 'referee'
                ? 'Scheidsrechter'
                : normalizedRole === 'player_manager'
                ? 'Team Manager'
                : 'Gebruiker'}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1">
        {/* Wedstrijdformulieren groep - filtered by tab visibility */}
        {renderGroup("Wedstrijdformulieren", visibleWedstrijdformulierenItems)}

        {/* Beheer groep */}
        {renderGroup("Beheer", visibleBeheerItems)}

        {/* Financieel groep */}
        {renderGroup("Financieel", visibleFinancieelItems)}

        {/* Systeem groep */}
        {renderGroup("Systeem", visibleSysteemItems)}

        {/* Speelformaten groep - helemaal onderaan */}
        {renderGroup("Speelformaten", visibleSpeelformatenItems)}

        {/* Uitloggen knop direct onder Systeem/Instellingen */}
        <div className="mt-2 pb-4">
          <button
            onClick={logout}
            className={`btn-nav active w-full flex items-center ${collapsed ? 'justify-center p-2' : 'justify-start gap-2 px-4 py-3'}`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Uitloggen</span>}
          </button>
        </div>
      </div>
    </div>
  );
}