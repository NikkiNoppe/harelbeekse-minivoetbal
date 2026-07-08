
import React from "react";
import { Settings, Lock, Trophy, Building, Clock, Calendar, FileText, ShieldAlert } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { SectionAccordionItem } from "@/components/layout";
import PlayerListLockSettings from "@/components/pages/admin/settings/components/PlayerListLockSettings";
import CompetitionDataSettings from "@/components/pages/admin/settings/components/CompetitionDataSettings";
import VenuesSettings from "@/components/pages/admin/settings/components/VenuesSettings";
import TimeslotsSettings from "@/components/pages/admin/settings/components/TimeslotsSettings";
import VacationsSettings from "@/components/pages/admin/settings/components/VacationsSettings";
import SeasonDataSettings from "@/components/pages/admin/settings/components/SeasonDataSettings";
import MatchFormSettings from "@/components/pages/admin/settings/components/MatchFormSettings";
import { SuspensionRulesSettings } from "@/components/pages/admin/settings/components/SuspensionRulesSettings";

/** Competitie-/seizoeninstellingen per organisatie (org-admin). Tab-zichtbaarheid & kleuren → Platform beheer. */
const settingsSections = [
  { id: "suspension-rules", label: "Kaarten & Schorsingen", icon: ShieldAlert, component: SuspensionRulesSettings },
  { id: "player-lock", label: "Spelerslijst Vergrendeling", icon: Lock, component: PlayerListLockSettings },
  { id: "formats", label: "Competitie Formaten", icon: Trophy, component: CompetitionDataSettings },
  { id: "venues", label: "Locaties", icon: Building, component: VenuesSettings },
  { id: "timeslots", label: "Tijdslots", icon: Clock, component: TimeslotsSettings },
  { id: "vacations", label: "Vakanties & velden", icon: Calendar, component: VacationsSettings },
  { id: "season", label: "Seizoensdata", icon: Calendar, component: SeasonDataSettings },
  { id: "match-forms", label: "Wedstrijdformulieren", icon: FileText, component: MatchFormSettings },
];

const AdminSettingsPanel: React.FC = () => {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2 text-brand-dark">
          <Settings className="h-5 w-5" />
          Instellingen
        </h2>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {settingsSections.map(({ id, label, icon: Icon, component: Component }) => (
          <SectionAccordionItem
            key={id}
            value={id}
            triggerContent={
              <span className="flex items-center gap-3 text-left min-w-0">
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="truncate">{label}</span>
              </span>
            }
          >
            <Component />
          </SectionAccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default AdminSettingsPanel;
