import React from "react";
import { useTabVisibilitySettings, RoleKey } from "@/hooks/useTabVisibilitySettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  'teams-admin': 'Teams (Admin)',
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground w-1/3">Tab</th>
              {ROLES.map(role => (
                <th key={role.key} className="text-center py-3 px-2 font-medium text-muted-foreground">
                  <div className="flex flex-col items-center gap-1">
                    <role.icon className="h-4 w-4" />
                    <span className="text-xs">{role.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupTabs.map(({ key, setting, displayName }) => (
              <tr key={key} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-3 px-4">
                  <span className="font-medium">{displayName}</span>
                  {!setting && (
                    <Badge variant="outline" className="ml-2 text-xs">Niet geconfigureerd</Badge>
                  )}
                </td>
                {ROLES.map(role => {
                  const isVisible = setting?.visibility?.[role.key] ?? false;
                  return (
                    <td key={role.key} className="py-3 px-2 text-center">
                      <Switch
                        checked={isVisible}
                        onCheckedChange={() => setting && handleToggle(key, role.key, isVisible)}
                        disabled={!setting}
                        className="data-[state=checked]:bg-primary"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
      <div className="space-y-3">
        {groupTabs.map(({ key, setting, displayName }) => (
          <div key={key} className="bg-muted/30 rounded-lg p-4">
            <div className="font-medium mb-3 flex items-center justify-between">
              <span>{displayName}</span>
              {!setting && (
                <Badge variant="outline" className="text-xs">Niet geconfigureerd</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(role => {
                const isVisible = setting?.visibility?.[role.key] ?? false;
                return (
                  <div key={role.key} className="flex items-center justify-between bg-background/50 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <role.icon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{role.label}</span>
                    </div>
                    <Switch
                      checked={isVisible}
                      onCheckedChange={() => setting && handleToggle(key, role.key, isVisible)}
                      disabled={!setting}
                      className="scale-90 data-[state=checked]:bg-primary"
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Tab Zichtbaarheid per Rol
        </CardTitle>
        <CardDescription>
          Configureer welke tabs zichtbaar zijn voor elke gebruikersrol
        </CardDescription>
        
        {/* Role Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
          {ROLES.map(role => (
            <div key={role.key} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${role.color}`} />
              <role.icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{role.label}</span>
              <span className="text-muted-foreground text-xs hidden sm:inline">({role.description})</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <Accordion type="multiple" defaultValue={TAB_GROUPS.map(g => g.id)} className="space-y-4">
          {TAB_GROUPS.map(group => (
            <AccordionItem key={group.id} value={group.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <group.icon className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-semibold">{group.title}</div>
                    <div className="text-sm text-muted-foreground font-normal">{group.description}</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
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
