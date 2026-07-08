/** Gedeelde inklapbare sectie — zelfde look als ReglementPage accordion. */

export const SECTION_COLLAPSIBLE_SURFACE =
  "w-full border border-primary/20 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 card-hover bg-card";

/** Trigger: px-5 py-4, compacte kopregel, 44px touch, open = brand-50 achtergrond */
export const SECTION_COLLAPSIBLE_TRIGGER =
  "flex w-full items-center justify-between gap-4 px-5 py-4 min-h-[44px] text-base font-semibold text-brand-dark hover:bg-brand-50 data-[state=open]:bg-brand-50 transition-colors duration-200 hover:no-underline";

export const SECTION_COLLAPSIBLE_CONTENT =
  "px-5 py-4 text-sm text-card-foreground border-t border-primary/10 bg-card min-w-0 overflow-hidden";

/** Ingeneste sub-sectie (bv. "Gelezen notities", "Afgelopen wedstrijden") */
export const SECTION_COLLAPSIBLE_NESTED_TRIGGER =
  "group flex w-full items-center gap-2 py-2 min-h-[44px] text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer";

/** Profiel-paneel binnen SectionCollapsibleCard (schorsingen, …) */
export const PROFILE_INSET_PANEL = "divide-y divide-primary/10 min-w-0";
export const PROFILE_INSET_SECTION = "px-4 py-4 sm:px-5 min-w-0";
export const PROFILE_INSET_SECTION_MUTED =
  "px-4 py-4 sm:px-5 bg-muted/25 min-w-0";
export const PROFILE_SECTION_LABEL =
  "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
