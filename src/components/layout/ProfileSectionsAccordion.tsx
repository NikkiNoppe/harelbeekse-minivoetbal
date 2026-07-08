import React, { createContext, useContext } from "react";
import { Accordion } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const ProfileAccordionContext = createContext<string | undefined>(undefined);

/** Of dit accordion-item momenteel open staat (bv. voor lazy mount). */
export function useProfileAccordionItem(itemValue: string): boolean {
  const openValue = useContext(ProfileAccordionContext);
  return openValue === itemValue;
}

interface ProfileSectionsAccordionProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Profiel-secties: één open tegelijk (zoals ReglementPage).
 * Gebruik `accordionValue` op SectionCollapsibleCard als child.
 */
export function ProfileSectionsAccordion({
  value,
  onValueChange,
  children,
  className,
}: ProfileSectionsAccordionProps) {
  return (
    <ProfileAccordionContext.Provider value={value}>
      <Accordion
        type="single"
        collapsible
        value={value ?? ""}
        onValueChange={(next) => onValueChange?.(next || undefined)}
        className={cn("space-y-3", className)}
      >
        {children}
      </Accordion>
    </ProfileAccordionContext.Provider>
  );
}
