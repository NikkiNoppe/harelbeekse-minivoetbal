import { cn } from "@/lib/utils";

/** Kaakrand voor speeldag-accordeons */
export const SCHEDULE_SURFACE = cn(
  "rounded-lg border border-purple-light bg-card overflow-hidden",
  "transition-shadow duration-200 motion-safe:transition-shadow",
  "shadow-[0_1px_3px_0_rgba(0,72,120,0.06)]",
  "hover:shadow-[0_2px_6px_-1px_rgba(0,72,120,0.1)]",
);

export const SCHEDULE_CONTROL_HEIGHT = "h-11 min-h-[44px] max-h-11";

/**
 * Uniforme controls in het speelschema (filter, download, speeldag-header).
 * ui-ux-pro-max: één text-sm/font-medium, zichtbare hover, cursor-pointer, 200ms transitions.
 */
export const SCHEDULE_CONTROL = cn(
  SCHEDULE_CONTROL_HEIGHT,
  "rounded-lg border border-purple-light bg-card",
  "text-sm font-medium text-foreground",
  "transition-colors duration-200 motion-safe:transition-colors",
  "cursor-pointer",
  "hover:!bg-primary/5 hover:!border-primary/50 hover:!text-foreground",
  "active:!bg-primary/10",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

/** Actieve/open staat (filter, download) */
export const SCHEDULE_CONTROL_ACTIVE = cn(
  "data-[state=open]:bg-primary/10 data-[state=open]:border-primary/50",
);

/** Teamfilter in speelschema — één bron, geen conflicterende select-base-styles */
export const SCHEDULE_FILTER_TRIGGER = cn(
  SCHEDULE_CONTROL,
  SCHEDULE_CONTROL_ACTIVE,
  "w-full justify-between px-3 shadow-none",
);

/** Accordion-item wrapper — één uniforme rand rondom */
export const SCHEDULE_ACCORDION_ITEM = SCHEDULE_SURFACE;

/**
 * Accordion-trigger binnen SCHEDULE_ACCORDION_ITEM — geen eigen border
 * (anders dubbele rand met de wrapper).
 */
export const SCHEDULE_TRIGGER = cn(
  SCHEDULE_CONTROL_HEIGHT,
  "border-0 rounded-none bg-transparent shadow-none",
  "text-sm font-medium text-[var(--color-600)]",
  "transition-colors duration-200 motion-safe:transition-colors",
  "cursor-pointer",
  "hover:!bg-primary/5",
  "active:!bg-primary/10",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

/** Gesloten: donkerblauw — open: lichtblauw (zelfde als wedstrijdrijen) */
export const SCHEDULE_TRIGGER_ACTIVE = cn(
  "data-[state=open]:!bg-primary/10",
  "data-[state=open]:text-purple-light",
);

/** Wedstrijdtekst in uitgeklapte speeldag */
export const SCHEDULE_MATCH_TEAM = "text-purple-light";
export const SCHEDULE_MATCH_SCORE = "text-[var(--color-600)]";
export const SCHEDULE_MATCH_META = "text-purple-light/80";

/** Wedstrijdrij in speeldag-accordeon */
export const SCHEDULE_MATCH_ROW = cn(
  "py-3 px-4 border-b border-purple-light last:border-b-0",
  "transition-colors duration-200 motion-safe:transition-colors",
  "hover:bg-primary/5",
);
