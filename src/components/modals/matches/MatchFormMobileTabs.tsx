import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  coerceMatchFormMobileTab,
  getMatchFormMobileTabLabel,
  getMatchFormMobileTabs,
  getSectionDesktopOrderClass,
  getSectionMobileTab,
  type MatchFormDesktopSection,
  type MatchFormMobileTab,
  type MatchFormRole,
} from "@/components/modals/matches/matchFormLayout";

interface MatchFormMobileTabBarProps {
  role: MatchFormRole;
  value: MatchFormMobileTab;
  onValueChange: (tab: MatchFormMobileTab) => void;
  className?: string;
}

/** Sticky tabbalk — alleen op mobiel tonen (`md:hidden` op parent). */
export function MatchFormMobileTabBar({
  role,
  value,
  onValueChange,
  className,
}: MatchFormMobileTabBarProps) {
  const tabs = getMatchFormMobileTabs(role);
  const safeValue = coerceMatchFormMobileTab(role, value);

  return (
    <Tabs
      key={role}
      value={safeValue}
      onValueChange={(next) => onValueChange(next as MatchFormMobileTab)}
      className={cn("md:hidden", className)}
    >
      <TabsList
        className="sticky top-0 z-10 grid h-auto w-full gap-1 p-1"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className="min-h-[44px] px-2 text-xs sm:text-sm"
          >
            {getMatchFormMobileTabLabel(tab)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

interface MatchFormSectionShellProps {
  section: MatchFormDesktopSection;
  role: MatchFormRole;
  mobileTab: MatchFormMobileTab;
  children: React.ReactNode;
  className?: string;
}

/** Eén DOM-node per sectie; mobiel verbergt inactieve tabs, desktop ordent via flex order. */
export function MatchFormSectionShell({
  section,
  role,
  mobileTab,
  children,
  className,
}: MatchFormSectionShellProps) {
  const sectionTab = getSectionMobileTab(section, role);
  const hiddenOnMobile = sectionTab !== null && sectionTab !== mobileTab;

  if (section === "wedstrijd" && role === "team_manager") {
    return null;
  }

  return (
    <div
      className={cn(
        hiddenOnMobile ? "max-md:hidden" : undefined,
        "md:block",
        getSectionDesktopOrderClass(section, role),
        className,
      )}
      data-match-form-section={section}
    >
      {children}
    </div>
  );
}
