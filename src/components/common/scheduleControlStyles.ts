import { cn } from "@/lib/utils";

/** Kaakrand voor speeldag-accordeons — border-hover gelijk aan schedule-controls */
export const SCHEDULE_SURFACE = cn(
  "rounded-lg border border-brand-light bg-card overflow-hidden",
  "transition-[box-shadow,border-color] duration-200 motion-safe:transition-[box-shadow,border-color]",
  "shadow-[0_1px_3px_0_var(--color-shadow-primary-07)]",
  "hover:shadow-[0_2px_6px_-1px_var(--color-shadow-primary-10)]",
  "hover:border-primary/50",
  "[&:has([data-state=open])]:border-primary/50",
);

export const SCHEDULE_CONTROL_HEIGHT = "h-11 min-h-[44px] max-h-11";

/**
 * Uniforme controls in het speelschema (filter, download).
 * Hover: border + shadow (zoals SCHEDULE_SURFACE), geen bg-/tekstwijziging.
 */
export const SCHEDULE_CONTROL = cn(
  SCHEDULE_CONTROL_HEIGHT,
  "rounded-lg border border-brand-light bg-card",
  "text-sm font-medium text-[var(--color-600)]",
  "transition-[box-shadow,border-color,background-color] duration-200 motion-safe:transition-[box-shadow,border-color,background-color]",
  "cursor-pointer",
  "shadow-[0_1px_3px_0_var(--color-shadow-primary-07)]",
  "hover:!border-primary/50 hover:!shadow-[0_2px_6px_-1px_var(--color-shadow-primary-10)]",
  "hover:!bg-card hover:!text-[var(--color-600)]",
  "active:!bg-card",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

/** Open staat (filter, download-dropdown) — border alleen, tekst blijft donkerblauw */
export const SCHEDULE_CONTROL_ACTIVE = cn(
  "data-[state=open]:border-primary/50 data-[state=open]:!text-[var(--color-600)] data-[state=open]:!bg-card",
);

/** Teamfilter in speelschema — één bron, geen conflicterende select-base-styles */
export const SCHEDULE_FILTER_TRIGGER = cn(
  SCHEDULE_CONTROL,
  SCHEDULE_CONTROL_ACTIVE,
  "w-full justify-between px-3 shadow-none",
);

/** Download-trigger — native button, zelfde patroon als SCHEDULE_FILTER_TRIGGER */
export const SCHEDULE_DOWNLOAD_TRIGGER = cn(
  SCHEDULE_CONTROL,
  SCHEDULE_CONTROL_ACTIVE,
  "inline-flex w-full items-center justify-center gap-1.5 px-3 shadow-none",
  "disabled:pointer-events-none",
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

/** Open: lichtblauwe achtergrond, titel blijft donkerblauw (--color-600) */
export const SCHEDULE_TRIGGER_ACTIVE = cn(
  "data-[state=open]:!bg-primary/10",
  "data-[state=open]:!text-[var(--color-600)]",
);

/** Wedstrijdtekst in uitgeklapte speeldag */
export const SCHEDULE_MATCH_TEAM = "text-brand-light";
export const SCHEDULE_MATCH_SCORE = "text-[var(--color-600)]";
export const SCHEDULE_MATCH_META = "text-brand-light/80";

/** Wedstrijdrij in speeldag-accordeon */
export const SCHEDULE_MATCH_ROW = cn(
  "py-3 px-4 border-b border-brand-light last:border-b-0",
  "transition-colors duration-200 motion-safe:transition-colors",
  "hover:bg-muted",
);

/** Download-dropdown — visueel gelijk aan schedule-controls */
export const SCHEDULE_DOWNLOAD_MENU = cn(
  "w-[min(100vw-2rem,15rem)] p-1.5",
  "rounded-lg border border-brand-light bg-white",
  "shadow-[0_4px_14px_0_var(--color-shadow-primary-12)]",
  "text-[var(--color-700)]",
);

export const SCHEDULE_DOWNLOAD_MENU_LABEL = cn(
  "px-2.5 py-1.5 text-xs font-semibold text-[var(--color-700)]/70",
);

export const SCHEDULE_DOWNLOAD_MENU_SEPARATOR = "bg-brand-light/60 my-1";

export const SCHEDULE_DOWNLOAD_MENU_ITEM = cn(
  "cursor-pointer min-h-[44px] rounded-md px-2.5 py-2 gap-3",
  "text-sm font-medium text-[var(--color-700)]",
  "transition-colors duration-200 motion-safe:transition-colors",
  "focus:bg-primary/5 focus:text-[var(--color-700)]",
  "data-[highlighted]:bg-primary/5 data-[highlighted]:text-[var(--color-700)]",
  "data-[disabled]:opacity-40",
);

export const SCHEDULE_DOWNLOAD_MENU_ICON = cn(
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
  "bg-primary/10 text-[var(--color-600)]",
);

export const SCHEDULE_DOWNLOAD_MENU_HINT = "text-xs font-normal text-muted-foreground leading-snug";

export const SCHEDULE_DOWNLOAD_BUTTON_DISABLED = cn(
  "opacity-55 cursor-not-allowed border-dashed border-brand-light/90",
  "bg-muted/25 text-muted-foreground shadow-none",
  "hover:!bg-muted/25 hover:!border-brand-light/90 hover:!text-muted-foreground hover:!shadow-none",
);
