import React from "react";
import { Calendar, Trophy, Award, Target, Users, Shield, User, DollarSign, Settings } from "lucide-react";
import { useAuth } from "@/components/pages/login/AuthProvider";
import { useSidebar } from "@/components/ui/sidebar";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  // Speelformaten groep (uitklapbaar) - alleen voor admin
  const speelformatenItems = [
    { key: "competition", label: "Competitie", icon: Trophy },
    { key: "cup", label: "Beker", icon: Award },
    { key: "playoffs", label: "Play-Offs", icon: Target },
  ];

  // Wedstrijdformulieren groep
  const wedstrijdformulierenItems = [
    { key: "match-forms-league", label: "Competitie", icon: Trophy, adminOnly: false },
    { key: "match-forms-cup", label: "Beker", icon: Award, adminOnly: false },
    { key: "playoffs", label: "Play-Offs", icon: Target, adminOnly: true },
  ];

  // Beheer groep
  const beheerItems = [
    { key: "players", label: "Spelers", icon: Users, adminOnly: false },
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

  const renderGroup = (title: string, items: any[]) => (
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

  return (
    <div className={`${collapsed ? "w-14" : "w-64"} flex flex-col h-full`}>
      <div className="flex-1">
        {/* Speelformaten groep - alleen voor admin */}
        {isAdmin && renderGroup("Speelformaten", speelformatenItems)}

        {/* Wedstrijdformulieren groep */}
        {renderGroup("Wedstrijdformulieren", wedstrijdformulierenItems.filter(item => !item.adminOnly || isAdmin))}

        {/* Beheer groep */}
        {renderGroup("Beheer", beheerItems.filter(item => !item.adminOnly || isAdmin))}

        {/* Financieel groep - alleen voor admin */}
        {isAdmin && renderGroup("Financieel", financieelItems)}

        {/* Systeem groep - alleen voor admin */}
        {isAdmin && renderGroup("Systeem", systeemItems)}
      </div>
    </div>
  );
}