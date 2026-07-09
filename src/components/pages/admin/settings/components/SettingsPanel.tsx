
import React from "react";
import {
  Settings,
  Trophy,
  Building,
  ShieldAlert,
} from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { SectionAccordionItem } from "@/components/layout";
import PlayerListLockSettings from "@/components/pages/admin/settings/components/PlayerListLockSettings";
import CompetitionFormatsSettings from "@/components/pages/admin/settings/components/CompetitionFormatsSettings";
import VenuesSettings from "@/components/pages/admin/settings/components/VenuesSettings";
import TimeslotsSettings from "@/components/pages/admin/settings/components/TimeslotsSettings";
import VacationsSettings from "@/components/pages/admin/settings/components/VacationsSettings";
import SeasonDataSettings from "@/components/pages/admin/settings/components/SeasonDataSettings";
import MatchFormSettings from "@/components/pages/admin/settings/components/MatchFormSettings";
import { SuspensionRulesSettings } from "@/components/pages/admin/settings/components/SuspensionRulesSettings";
import { useAuth } from "@/hooks/useAuth";

function GroupHeading({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <span className="flex min-w-0 flex-1 items-start gap-3 text-left">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="block truncate text-sm font-semibold text-brand-dark">{title}</span>
          <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px] font-medium">
            {badge}
          </Badge>
        </span>
        <span className="mt-1 block text-xs font-normal leading-relaxed normal-case tracking-normal text-muted-foreground">
          {description}
        </span>
      </span>
    </span>
  );
}

const AdminSettingsPanel: React.FC = () => {
  const { isSuperAdmin } = useAuth();

  return (
    <div className="space-y-4 sm:space-y-6 animate-slide-up pb-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Settings className="h-4 w-4" />
          Organisatie-instellingen
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-brand-dark sm:text-3xl">
            Instellingen per competitie
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Beheer de tenant-specifieke opzet van het seizoen, de speelomgeving en de
            praktische regels voor formulieren en schorsingen.
          </p>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {isSuperAdmin && (
          <SectionAccordionItem
            value="competition-setup"
            triggerContent={
              <GroupHeading
                icon={Trophy}
                title="Competitie-opzet"
                description="Formats die deze organisatie gebruikt voor latere competitiegeneratie."
                badge="SuperAdmin"
              />
            }
            itemClassName="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <CompetitionFormatsSettings />
          </SectionAccordionItem>
        )}

        <SectionAccordionItem
          value="season-environment"
          triggerContent={
            <GroupHeading
              icon={Building}
              title="Seizoen & Speelomgeving"
              description="Seizoensperiode, zalen, tijdslots en uitzonderingen voor deze competitie."
              badge="4 onderdelen"
            />
          }
          contentClassName="space-y-4"
          itemClassName="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <SeasonDataSettings />
          <VenuesSettings />
          <TimeslotsSettings />
          <VacationsSettings />
        </SectionAccordionItem>

        <SectionAccordionItem
          value="rules-forms"
          triggerContent={
            <GroupHeading
              icon={ShieldAlert}
              title="Regels & Formulieren"
              description="Schorsingen, spelerslijst-lock en wedstrijdformulierregels."
              badge="3 onderdelen"
            />
          }
          contentClassName="space-y-4"
          itemClassName="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <SuspensionRulesSettings />
          <PlayerListLockSettings />
          <MatchFormSettings />
        </SectionAccordionItem>
      </Accordion>
    </div>
  );
};

export default AdminSettingsPanel;
