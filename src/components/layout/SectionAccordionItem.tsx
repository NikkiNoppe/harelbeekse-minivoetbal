import React from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  SECTION_COLLAPSIBLE_CONTENT,
  SECTION_COLLAPSIBLE_SURFACE,
  SECTION_COLLAPSIBLE_TRIGGER,
} from "@/components/layout/section-collapsible-styles";
import { cn } from "@/lib/utils";

interface SectionAccordionItemProps {
  value: string;
  children: React.ReactNode;
  /** Eenvoudige titel; gebruik `triggerContent` voor iconen/badges */
  title?: React.ReactNode;
  triggerContent?: React.ReactNode;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
}

/**
 * Eén accordion-item in Reglement-stijl — voor lijsten (Reglement, Beker, Instellingen, …).
 */
export function SectionAccordionItem({
  value,
  children,
  title,
  triggerContent,
  triggerClassName,
  contentClassName,
  itemClassName,
}: SectionAccordionItemProps) {
  return (
    <AccordionItem
      value={value}
      className={cn(SECTION_COLLAPSIBLE_SURFACE, itemClassName)}
    >
      <AccordionTrigger
        className={cn(SECTION_COLLAPSIBLE_TRIGGER, triggerClassName)}
      >
        {triggerContent ?? (
          <span className="text-left flex-1 min-w-0">{title}</span>
        )}
      </AccordionTrigger>
      <AccordionContent
        className={cn(SECTION_COLLAPSIBLE_CONTENT, contentClassName)}
      >
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
