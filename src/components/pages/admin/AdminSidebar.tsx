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

  // Speelformat groep (uitklapbaar)
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
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-muted/50";

  const renderMenuItem = (item: any) => (
    <SidebarMenuItem key={item.key}>
      <SidebarMenuButton asChild>
        <button 
          onClick={() => onTabChange(item.key)}
          className={`w-full ${getNavClasses(item.key)}`}
        >
          <item.icon className="h-4 w-4" />
          {!collapsed && <span>{item.label}</span>}
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar
      collapsible="icon"
    >
      <SidebarContent>
        {/* Speelformat groep - alleen voor admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Speelformat</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {speelformatItems.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Beheer groep */}
        <SidebarGroup>
          <SidebarGroupLabel>Beheer</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {beheerItems
                .filter(item => !item.adminOnly || isAdmin)
                .map(renderMenuItem)
              }
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Financieel groep - alleen voor admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Financieel</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {financieelItems.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Systeem groep - alleen voor admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Systeem</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systeemItems.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}