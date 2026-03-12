
import React from "react";
import { Settings, Eye, Lock, Trophy, Building, Clock, Calendar, Palette, FileText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import TabVisibilitySettingsUpdated from "@/components/pages/admin/settings/components/TabVisibilitySettingsUpdated";
import PlayerListLockSettings from "@/components/pages/admin/settings/components/PlayerListLockSettings";
import CompetitionDataSettings from "@/components/pages/admin/settings/components/CompetitionDataSettings";
import VenuesSettings from "@/components/pages/admin/settings/components/VenuesSettings";
import TimeslotsSettings from "@/components/pages/admin/settings/components/TimeslotsSettings";
import VacationsSettings from "@/components/pages/admin/settings/components/VacationsSettings";
import SeasonDataSettings from "@/components/pages/admin/settings/components/SeasonDataSettings";
import ThemeColorsSettings from "@/components/pages/admin/settings/components/ThemeColorsSettings";
import MatchFormSettings from "@/components/pages/admin/settings/components/MatchFormSettings";

const settingsSections = [
  { id: "tab-visibility", label: "Tab Zichtbaarheid", icon: Eye, component: TabVisibilitySettingsUpdated },
  { id: "player-lock", label: "Spelerslijst Vergrendeling", icon: Lock, component: PlayerListLockSettings },
  { id: "formats", label: "Competitie Formaten", icon: Trophy, component: CompetitionDataSettings },
  { id: "venues", label: "Locaties", icon: Building, component: VenuesSettings },
  { id: "timeslots", label: "Tijdslots", icon: Clock, component: TimeslotsSettings },
  { id: "vacations", label: "Vakanties", icon: Calendar, component: VacationsSettings },
  { id: "season", label: "Seizoensdata", icon: Calendar, component: SeasonDataSettings },
  { id: "colors", label: "Kleuren", icon: Palette, component: ThemeColorsSettings },
];

const AdminSettingsPanel: React.FC = () => {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
          <Settings className="h-5 w-5" />
          Instellingen
        </h2>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {settingsSections.map(({ id, label, icon: Icon, component: Component }) => (
          <AccordionItem key={id} value={id} className="border rounded-lg px-4" style={{ borderColor: 'var(--color-200, hsl(var(--border)))' }}>
            <AccordionTrigger className="py-4 hover:no-underline">
              <span className="flex items-center gap-3 text-sm font-medium">
                <Icon className="h-4 w-4" style={{ color: 'var(--color-primary-base, hsl(var(--primary)))' }} />
                {label}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <Component />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default AdminSettingsPanel;
