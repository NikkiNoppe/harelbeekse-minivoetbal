import React from "react";
import { Calendar, Trophy, Award, Target, Users, Shield, User, DollarSign, Settings } from "lucide-react";
import { useAuth } from "@/components/pages/login/AuthProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const collapsed = state === "collapsed";

  // Speelformat groep (uitklapbaar) - alleen voor admin
  const speelformatItems = [
    { key: "competition", label: "Competitie", icon: Trophy },
    { key: "cup", label: "Beker", icon: Award },
    { key: "playoffs", label: "Play-Offs", icon: Target },
  ];

  // Beheer groep
  const beheerItems = [
    { key: "match-forms", label: "Wedstrijdformulieren", icon: Calendar, adminOnly: false },
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
    <SidebarMenuItem key={item.key}>
      <SidebarMenuButton asChild>
        <button 
          onClick={() => onTabChange(item.key)}
          className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-left font-medium border transition-all duration-200 ${getNavClasses(item.key)}`}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">{item.label}</span>}
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar
      collapsible="icon"
      className="bg-gradient-to-b from-white to-gray-50 border-r border-purple-200 shadow-lg"
    >
      <SidebarContent className="bg-transparent p-4">
        {/* Speelformat groep - alleen voor admin */}
        {isAdmin && (
          <SidebarGroup className="mb-6">
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
              Speelformat
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {speelformatItems.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Beheer groep */}
        <SidebarGroup className="mb-6">
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
            Beheer
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {beheerItems
                .filter(item => !item.adminOnly || isAdmin)
                .map(renderMenuItem)
              }
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Financieel groep - alleen voor admin */}
        {isAdmin && (
          <SidebarGroup className="mb-6">
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
              Financieel
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {financieelItems.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Systeem groep - alleen voor admin */}
        {isAdmin && (
          <SidebarGroup className="mb-6">
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
              Systeem
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {systeemItems.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}