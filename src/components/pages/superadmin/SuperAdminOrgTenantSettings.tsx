import React from "react";
import { Eye, Palette } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { SectionAccordionItem } from "@/components/layout";
import TabVisibilitySettingsUpdated from "@/components/pages/admin/settings/components/TabVisibilitySettingsUpdated";
import ThemeColorsSettings from "@/components/pages/admin/settings/components/ThemeColorsSettings";

/**
 * Per-tenant platform-instellingen (tab-navigatie + kleurenpalet).
 * Alleen tonen wanneer de superadmin deze organisatie actief heeft gemaakt —
 * hooks gebruiken de actieve tenant uit OrganizationContext.
 */
export function SuperAdminOrgTenantSettings() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Navigatie en visueel thema voor de actieve tenant. Wijzigingen gelden voor deze
        organisatie op het platform.
      </p>
      <Accordion type="multiple" defaultValue={[]} className="space-y-3">
        <SectionAccordionItem
          value="tab-visibility"
          triggerContent={
            <span className="flex items-center gap-3 text-left min-w-0">
              <Eye className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="truncate">Tab zichtbaarheid</span>
            </span>
          }
        >
          <TabVisibilitySettingsUpdated />
        </SectionAccordionItem>
        <SectionAccordionItem
          value="colors"
          triggerContent={
            <span className="flex items-center gap-3 text-left min-w-0">
              <Palette className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="truncate">Kleuren</span>
            </span>
          }
        >
          <ThemeColorsSettings />
        </SectionAccordionItem>
      </Accordion>
    </div>
  );
}
