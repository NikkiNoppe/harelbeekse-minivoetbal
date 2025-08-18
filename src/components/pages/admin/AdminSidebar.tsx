import React from "react";
import { Calendar, Trophy, Award, Target, Users, Shield, User, DollarSign, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/components/pages/login/AuthProvider";
import { useSidebar } from "@/components/ui/sidebar";
import { useTabVisibility } from "@/context/TabVisibilityContext";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isTabVisible } = useTabVisibility();
  // Speelformaten groep (uitklapbaar) - alleen voor admin
  const speelformatenItems = [
    { key: "competition", label: "Competitie", icon: Trophy },
    { key: "cup", label: "Beker", icon: Award },
    { key: "playoffs", label: "Playoff Genereren", icon: Target },
  ];

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

  // Systeem groep
  const systeemItems = [
    { key: "settings", label: "Instellingen", icon: Settings, adminOnly: true },
  ];

  const isActive = (key: string) => activeTab === key;
  const getNavClasses = (key: string) =>
    isActive(key) 
      ? "bg-purple-400 text-white font-medium border-purple-600" 
      : "bg-white text-purple-600 border-purple-400 hover:bg-purple-100 hover:text-purple-700";

  const renderMenuItem = (item: any) => (
    <div key={item.key} className="mb-0.5">
      <button 
        onClick={() => onTabChange(item.key)}
        className={`w-full flex items-center ${collapsed ? "justify-center px-2" : "justify-start gap-2 px-3"} py-2 rounded-lg text-left font-medium border transition-all duration-200 ${getNavClasses(item.key)}`}
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
  const visibleSpeelformatenItems = speelformatenItems.filter(item => 
    isAdmin && isTabVisible(item.key)
  );

  const visibleWedstrijdformulierenItems = wedstrijdformulierenItems.filter(item => 
    (!item.adminOnly || isAdmin) && 
    (item.key === 'match-forms-league' ? isTabVisible('admin_match_forms_league') : 
     item.key === 'match-forms-cup' ? isTabVisible('admin_match_forms_cup') : 
     item.key === 'match-forms-playoffs' ? isTabVisible('admin_match_forms_playoffs') : true)
  );

  const visibleBeheerItems = beheerItems.filter(item => 
    (!item.adminOnly || isAdmin)
  );

  const visibleFinancieelItems = financieelItems.filter(item => 
    (!item.adminOnly || isAdmin)
  );

  const visibleSysteemItems = systeemItems.filter(item => 
    (!item.adminOnly || isAdmin)
  );

  return (
    <div className={`${collapsed ? "w-14" : "w-64"} flex flex-col h-full`}>
      {/* Header bovenaan: "admin" en "Administrator" */}
      <div className="mb-3">
        {collapsed ? (
          <div className="flex items-center justify-center">
            <Shield className="h-4 w-4 text-purple-600" />
          </div>
        ) : (
          <div className="px-1">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">admin</div>
            <div className="text-base font-semibold text-purple-700">Administrator</div>
          </div>
        )}
      </div>

      <div className="flex-1">
        {/* Speelformaten groep - filtered by tab visibility */}
        {renderGroup("Speelformaten", visibleSpeelformatenItems)}

        {/* Wedstrijdformulieren groep - filtered by tab visibility */}
        {renderGroup("Wedstrijdformulieren", visibleWedstrijdformulierenItems)}

        {/* Beheer groep */}
        {renderGroup("Beheer", visibleBeheerItems)}

        {/* Financieel groep */}
        {renderGroup("Financieel", visibleFinancieelItems)}

        {/* Systeem groep */}
        {renderGroup("Systeem", visibleSysteemItems)}

        {/* Uitloggen knop direct onder Systeem/Instellingen */}
        <div className="mt-2">
          <button
            onClick={logout}
            className={`w-full flex items-center ${collapsed ? "justify-center px-2" : "justify-start gap-2 px-3"} py-2 rounded-lg text-left font-medium border transition-all duration-200 bg-white text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Uitloggen</span>}
          </button>
        </div>
      </div>
    </div>
  );
}