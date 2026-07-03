import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  getMatchFormMobileTabLabel,
  getMatchFormMobileTabs,
  getSectionDesktopOrder,
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

  return (
    <Tabs
      value={value}
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
  isMobile: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Eén DOM-node per sectie; mobiel verbergt inactieve tabs, desktop ordent via flex order. */
export function MatchFormSectionShell({
  section,
  role,
  mobileTab,
  isMobile,
  children,
  className,
}: MatchFormSectionShellProps) {
  const sectionTab = getSectionMobileTab(section, role);
  const hiddenOnMobile = isMobile && sectionTab !== null && sectionTab !== mobileTab;

  if (section === "wedstrijd" && role === "team_manager") {
    return null;
  }

  return (
    <div
      className={cn(hiddenOnMobile && "hidden", "md:block", className)}
      style={{ order: getSectionDesktopOrder(section, role) }}
      data-match-form-section={section}
    >
      {children}
    </div>
  );
}
