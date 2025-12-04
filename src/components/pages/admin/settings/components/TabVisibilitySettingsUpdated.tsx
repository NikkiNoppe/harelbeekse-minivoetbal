
import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Settings, Users, Shield, UserCheck, Eye } from "lucide-react";
import { useTabVisibilitySettings, RoleKey } from "@/hooks/useTabVisibilitySettings";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RoleInfo {
  key: RoleKey;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const ROLES: RoleInfo[] = [
  {
    key: 'public',
    label: 'Publiek',
    shortLabel: 'Pub',
    icon: <Eye className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-700',
    description: 'Niet-ingelogde bezoekers',
  },
  {
    key: 'player_manager',
    label: 'Teamverantw.',
    shortLabel: 'Team',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-700',
    description: 'Teamverantwoordelijken',
  },
  {
    key: 'referee',
    label: 'Scheidsrechter',
    shortLabel: 'Ref',
    icon: <UserCheck className="h-4 w-4" />,
    color: 'bg-amber-100 text-amber-700',
    description: 'Scheidsrechters',
  },
  {
    key: 'admin',
    label: 'Admin',
    shortLabel: 'Adm',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-700',
    description: 'Beheerders (altijd toegang)',
  },
];

const TAB_DISPLAY_NAMES: Record<string, string> = {
  'algemeen': 'Algemeen',
  'competitie': 'Competitie',
  'playoff': 'Play-offs',
  'beker': 'Beker',
  'schorsingen': 'Schorsingen',
  'reglement': 'Reglement',
  'teams': 'Teams',
  'scheidsrechters': 'Scheidsrechters',
  'kaarten': 'Kaarten',
  'match-forms-league': 'Formulieren (Competitie)',
  'match-forms-cup': 'Formulieren (Beker)',
  'match-forms-playoffs': 'Formulieren (Play-offs)',
  'admin_match_forms_league': 'Admin Formulieren (Competitie)',
  'admin_match_forms_cup': 'Admin Formulieren (Beker)',
  'admin_match_forms_playoffs': 'Admin Formulieren (Play-offs)',
};

const TabVisibilitySettingsUpdated: React.FC = () => {
  const { settings, loading, updateRoleVisibility } = useTabVisibilitySettings();

  const publicTabKeys = useMemo(
    () => ['algemeen', 'competitie', 'playoff', 'beker', 'schorsingen', 'reglement', 'teams', 'scheidsrechters', 'kaarten'],
    []
  );

  const loginTabKeys = useMemo(
    () => ['match-forms-league', 'match-forms-cup', 'match-forms-playoffs'],
    []
  );

  const publicTabs = useMemo(
    () => settings.filter(s => publicTabKeys.includes(s.setting_name)),
    [settings, publicTabKeys]
  );

  const loginTabs = useMemo(
    () => settings.filter(s => loginTabKeys.includes(s.setting_name)),
    [settings, loginTabKeys]
  );

  const handleToggle = async (settingName: string, role: RoleKey, currentValue: boolean) => {
    await updateRoleVisibility(settingName, role, !currentValue);
  };

  const getTabDisplayName = (settingName: string) => {
    return TAB_DISPLAY_NAMES[settingName] || settingName.charAt(0).toUpperCase() + settingName.slice(1);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Instellingen laden...</div>
        </CardContent>
      </Card>
    );
  }

  // Desktop table view
  const renderDesktopTable = (tabs: typeof settings, title: string, description: string) => (
    <div className="hidden md:block">
      <div className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px] font-semibold">Tab</TableHead>
              {ROLES.map(role => (
                <TableHead key={role.key} className="text-center w-[120px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="outline" className={`${role.color} border-0 px-2 py-1`}>
                            {role.icon}
                            <span className="ml-1 hidden lg:inline">{role.label}</span>
                            <span className="ml-1 lg:hidden">{role.shortLabel}</span>
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{role.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tabs.map(setting => (
              <TableRow key={setting.setting_name} className="hover:bg-muted/30">
                <TableCell className="font-medium">
                  {getTabDisplayName(setting.setting_name)}
                </TableCell>
                {ROLES.map(role => (
                  <TableCell key={role.key} className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={setting.visibility?.[role.key] ?? true}
                        onCheckedChange={() => handleToggle(setting.setting_name, role.key, setting.visibility?.[role.key] ?? true)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  // Mobile accordion view
  const renderMobileAccordion = (tabs: typeof settings, title: string, description: string) => (
    <div className="md:hidden">
      <div className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Accordion type="multiple" className="space-y-2">
        {tabs.map(setting => (
          <AccordionItem 
            key={setting.setting_name} 
            value={setting.setting_name}
            className="border rounded-lg px-4 bg-card"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">{getTabDisplayName(setting.setting_name)}</span>
                <div className="flex gap-1">
                  {ROLES.map(role => (
                    <span
                      key={role.key}
                      className={`w-2 h-2 rounded-full ${
                        setting.visibility?.[role.key] ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-3">
                {ROLES.map(role => (
                  <div 
                    key={role.key} 
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${role.color} border-0`}>
                        {role.icon}
                      </Badge>
                      <span className="text-sm font-medium">{role.label}</span>
                    </div>
                    <Switch
                      checked={setting.visibility?.[role.key] ?? true}
                      onCheckedChange={() => handleToggle(setting.setting_name, role.key, setting.visibility?.[role.key] ?? true)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Tab Zichtbaarheid
        </CardTitle>
        <CardDescription>
          Beheer welke tabs zichtbaar zijn per gebruikersrol. Admins hebben altijd toegang.
        </CardDescription>
        
        {/* Role Legend - visible on all screens */}
        <div className="flex flex-wrap gap-2 pt-3">
          {ROLES.map(role => (
            <TooltipProvider key={role.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={`${role.color} border-0 cursor-help`}>
                    {role.icon}
                    <span className="ml-1">{role.label}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{role.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Public Tabs Section */}
        {renderDesktopTable(publicTabs, "Publieke Tabs", "Tabs die op de hoofdpagina zichtbaar kunnen zijn")}
        {renderMobileAccordion(publicTabs, "Publieke Tabs", "Tabs die op de hoofdpagina zichtbaar kunnen zijn")}

        {/* Login Required Tabs Section */}
        {loginTabs.length > 0 && (
          <>
            <div className="border-t pt-6">
              {renderDesktopTable(loginTabs, "Wedstrijdformulieren", "Tabs die login vereisen - niet beschikbaar voor publiek")}
              {renderMobileAccordion(loginTabs, "Wedstrijdformulieren", "Tabs die login vereisen - niet beschikbaar voor publiek")}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TabVisibilitySettingsUpdated;
