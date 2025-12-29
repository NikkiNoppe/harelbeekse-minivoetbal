import React from "react";
import { useTabVisibilitySettings, RoleKey } from "@/hooks/useTabVisibilitySettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Users, Shield, UserCog, Globe, ClipboardList, Settings, DollarSign, Cog, Trophy } from "lucide-react";

// Role configuration
interface RoleInfo {
  key: RoleKey;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const ROLES: RoleInfo[] = [
  { key: 'public', label: 'Publiek', icon: Globe, color: 'bg-blue-500', description: 'Niet-ingelogde bezoekers' },
  { key: 'player_manager', label: 'Teamverantw.', icon: Users, color: 'bg-green-500', description: 'Teamverantwoordelijken' },
  { key: 'referee', label: 'Scheidsrechter', icon: Shield, color: 'bg-yellow-500', description: 'Scheidsrechters' },
  { key: 'admin', label: 'Admin', icon: UserCog, color: 'bg-red-500', description: 'Beheerders' },
];

// Tab groups organized like the hamburger menu
const TAB_GROUPS = [
  {
    id: 'menu',
    title: 'Menu (Publiek)',
    description: "Pagina's zichtbaar op de hoofdwebsite",
    icon: Globe,
    tabs: ['algemeen', 'reglement', 'competitie', 'beker', 'playoff'],
  },
  {
    id: 'wedstrijdformulieren',
    title: 'Wedstrijdformulieren',
    description: 'Formulieren voor wedstrijden - vereist login',
    icon: ClipboardList,
    tabs: ['match-forms-league', 'match-forms-cup', 'match-forms-playoffs'],
  },
  {
    id: 'beheer',
    title: 'Beheer',
    description: "Beheer pagina's voor teams, spelers en gebruikers",
    icon: Settings,
    tabs: ['players', 'scheidsrechters', 'schorsingen', 'teams-admin', 'users'],
  },
  {
    id: 'financieel',
    title: 'Financieel',
    description: 'Financiële administratie',
    icon: DollarSign,
    tabs: ['financial'],
  },
  {
    id: 'speelformaten',
    title: 'Speelformaten',
    description: 'Configuratie van competities en bekerwedstrijden',
    icon: Trophy,
    tabs: ['format-competition', 'format-cup', 'format-playoffs'],
  },
  {
    id: 'systeem',
    title: 'Systeem',
    description: 'Systeeminstellingen en content beheer',
    icon: Cog,
    tabs: ['settings', 'blog-management', 'notification-management'],
  },
];

// Display names for all tabs
const TAB_DISPLAY_NAMES: Record<string, string> = {
  'algemeen': 'Algemeen',
  'reglement': 'Reglement',
  'competitie': 'Competitie',
  'beker': 'Beker',
  'playoff': 'Play-off',
  'match-forms-league': 'Competitie',
  'match-forms-cup': 'Beker',
  'match-forms-playoffs': 'Play-Off',
  'players': 'Spelers',
  'scheidsrechters': 'Scheidsrechters',
  'schorsingen': 'Schorsingen',
  'teams-admin': 'Teams',
  'users': 'Gebruikers',
  'financial': 'Financieel',
  'format-competition': 'Competitie',
  'format-cup': 'Beker',
  'format-playoffs': 'Playoff',
  'settings': 'Instellingen',
  'blog-management': 'Blog Beheer',
  'notification-management': 'Notificaties',
};

const TabVisibilitySettingsUpdated: React.FC = () => {
  const { settings, loading, updateRoleVisibility } = useTabVisibilitySettings();

  const handleToggle = (settingName: string, role: RoleKey, currentValue: boolean) => {
    updateRoleVisibility(settingName, role, !currentValue);
  };

  const getSettingForTab = (tabKey: string) => {
    return settings.find(s => s.setting_name === tabKey);
  };

  // Desktop table for a group
  const renderGroupTable = (group: typeof TAB_GROUPS[0]) => {
    const groupTabs = group.tabs.map(tabKey => ({
      key: tabKey,
      setting: getSettingForTab(tabKey),
      displayName: TAB_DISPLAY_NAMES[tabKey] || tabKey,
    }));

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-auto">Tab</TableHead>
            {ROLES.map(role => (
              <TableHead key={role.key} className="text-center w-[80px]">
                <div className="flex flex-col items-center gap-1">
                  <role.icon className="h-4 w-4" />
                  <span className="text-xs">{role.label}</span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupTabs.map(({ key, setting, displayName }) => (
            <TableRow key={key}>
              <TableCell className="font-medium">
                {displayName}
                {!setting && (
                  <Badge variant="outline" className="ml-2 text-xs">Niet geconfigureerd</Badge>
                )}
              </TableCell>
              {ROLES.map(role => {
                const isVisible = setting?.visibility?.[role.key] ?? false;
                return (
                  <TableCell key={role.key} className="text-center">
                    <Switch
                      checked={isVisible}
                      onCheckedChange={() => setting && handleToggle(key, role.key, isVisible)}
                      disabled={!setting}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Mobile accordion for a group
  const renderGroupMobile = (group: typeof TAB_GROUPS[0]) => {
    const groupTabs = group.tabs.map(tabKey => ({
      key: tabKey,
      setting: getSettingForTab(tabKey),
      displayName: TAB_DISPLAY_NAMES[tabKey] || tabKey,
    }));

    return (
      <div className="space-y-2">
        {groupTabs.map(({ key, setting, displayName }) => (
          <div key={key} className="bg-white rounded-lg p-2 sm:p-4 border border-purple-200">
            <div className="font-medium mb-2 flex items-center justify-between text-purple-800">
              <span className="text-sm">{displayName}</span>
              {!setting && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">N/A</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLES.map(role => {
                const isVisible = setting?.visibility?.[role.key] ?? false;
                return (
                  <div key={role.key} className="flex items-center justify-between bg-purple-50 rounded px-1.5 py-1">
                    <div className="flex items-center gap-1">
                      <role.icon className="h-2.5 w-2.5 text-purple-600" />
                      <span className="text-[10px] text-purple-700">{role.label}</span>
                    </div>
                    <Switch
                      checked={isVisible}
                      onCheckedChange={() => setting && handleToggle(key, role.key, isVisible)}
                      disabled={!setting}
                      className="scale-75"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
          Tab Zichtbaarheid per Rol
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Configureer welke tabs zichtbaar zijn per rol
        </CardDescription>
        
        {/* Role Legend - compact grid on mobile */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
          {ROLES.map(role => (
            <div key={role.key} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${role.color}`} />
              <role.icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="font-medium truncate">{role.label}</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-6">
        <Accordion type="multiple" defaultValue={TAB_GROUPS.map(g => g.id)} className="space-y-2 sm:space-y-4">
          {TAB_GROUPS.map(group => (
            <AccordionItem key={group.id} value={group.id} className="border rounded-lg px-2 sm:px-4">
              <AccordionTrigger className="hover:no-underline py-2 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <group.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-semibold text-sm sm:text-base">{group.title}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-normal hidden sm:block">{group.description}</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2 sm:pb-4">
                {/* Desktop view */}
                <div className="hidden md:block">
                  {renderGroupTable(group)}
                </div>
                {/* Mobile view */}
                <div className="md:hidden">
                  {renderGroupMobile(group)}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default TabVisibilitySettingsUpdated;
