import React from "react";
import { cn } from "@/lib/utils";

/** Standaard wrapper voor publieke content-pagina's (algemeen, competitie, beker, …). */
export const PUBLIC_PAGE_CLASS =
  "space-y-4 sm:space-y-6 motion-safe:animate-slide-up pb-6";

/** Sectiekop (h2) binnen een publieke pagina. */
export const PUBLIC_SECTION_HEADING_CLASS =
  "text-lg font-semibold text-brand-dark mb-3";

/** Standaard Card-styling voor publieke secties. */
export const PUBLIC_CARD_CLASS =
  "shadow-lg hover:shadow-xl transition-shadow duration-300 card-hover border-primary/20";

interface PublicPageProps {
  children: React.ReactNode;
  className?: string;
}

export function PublicPage({ children, className }: PublicPageProps) {
  return <div className={cn(PUBLIC_PAGE_CLASS, className)}>{children}</div>;
}

interface PublicSectionHeadingProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function PublicSectionHeading({
  id,
  children,
  className,
  action,
}: PublicSectionHeadingProps) {
  if (action) {
    return (
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 id={id} className={cn(PUBLIC_SECTION_HEADING_CLASS, "mb-0", className)}>
          {children}
        </h2>
        {action}
      </div>
    );
  }

  return (
    <h2 id={id} className={cn(PUBLIC_SECTION_HEADING_CLASS, className)}>
      {children}
    </h2>
  );
}
