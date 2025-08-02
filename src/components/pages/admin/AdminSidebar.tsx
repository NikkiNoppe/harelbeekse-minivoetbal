import React from "react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  useSidebar 
} from "@/components/ui/sidebar";
import { 
  Calendar, 
  Users, 
  Shield, 
  User, 
  DollarSign, 
  Settings,
  Trophy,
  Award,
  Target,
  Home
} from "lucide-react";
import { useAuth } from "@/components/pages/login/AuthProvider";

type TabName = "match-forms" | "players" | "teams" | "users" | "competition" | "playoffs" | "cup" | "financial" | "settings" | "speelformat";

interface AdminSidebarProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { state } = useSidebar();
  const isAdmin = user?.role === "admin";
  const collapsed = state === "collapsed";

  const speelformatItems = [
    { key: "competition" as TabName, label: "Competitie", icon: Trophy, adminOnly: true },
    { key: "cup" as TabName, label: "Beker", icon: Award, adminOnly: true },
    { key: "playoffs" as TabName, label: "Play-Offs", icon: Target, adminOnly: true },
  ];

  const beheerItems = [
    { key: "players" as TabName, label: "Spelers", icon: Users, adminOnly: false },
    { key: "teams" as TabName, label: "Teams", icon: Shield, adminOnly: true },
    { key: "users" as TabName, label: "Gebruikers", icon: User, adminOnly: true },
  ];

  const financieelItems = [
    { key: "financial" as TabName, label: "Financiën", icon: DollarSign, adminOnly: true },
  ];

  const systeemItems = [
    { key: "settings" as TabName, label: "Instellingen", icon: Settings, adminOnly: true },
  ];

  const getNavClassName = (itemKey: TabName) => {
    return activeTab === itemKey 
      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground";
  };

  const renderMenuItems = (items: Array<{ key: TabName; label: string; icon: any; adminOnly: boolean }>, showAdminOnly: boolean = true) => {
    return items
      .filter(item => showAdminOnly || !item.adminOnly || isAdmin)
      .map((item) => (
        <SidebarMenuItem key={item.key}>
          <SidebarMenuButton 
            onClick={() => setActiveTab(item.key)}
            className={getNavClassName(item.key)}
          >
            <item.icon className="h-4 w-4" />
            {!collapsed && <span>{item.label}</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ));
  };

  return (
    <Sidebar className="border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarContent className="p-2">
        {/* Dashboard Home */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab("match-forms")}
                  className={getNavClassName("match-forms")}
                >
                  <Home className="h-4 w-4" />
                  {!collapsed && <span>Dashboard</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab("speelformat")}
                  className={getNavClassName("speelformat")}
                >
                  <Calendar className="h-4 w-4" />
                  {!collapsed && <span>Speelformat</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Speelformat Groep - alleen voor admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {!collapsed && "Toernooien"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuItems(speelformatItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Beheer Groep */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {!collapsed && "Beheer"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(beheerItems, false)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Financieel Groep - alleen voor admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {!collapsed && "Financieel"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuItems(financieelItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Systeem Groep - alleen voor admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {!collapsed && "Systeem"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuItems(systeemItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;