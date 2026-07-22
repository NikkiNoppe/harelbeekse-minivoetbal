import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

export type SectionIconVariant = "section" | "compact" | "group";

type SectionIconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

const ICON_CLASS: Record<SectionIconVariant, string> = {
  /** CardTitle / page section headings */
  section: "h-5 w-5 shrink-0 text-primary",
  /** Collapsibles, inline labels, org-hub section titles */
  compact: "h-4 w-4 shrink-0 text-primary",
  /** Accordion group headings (SettingsPanel) */
  group: "h-4 w-4 shrink-0",
};

interface SectionIconProps {
  icon: SectionIconComponent;
  variant?: SectionIconVariant;
  className?: string;
}

/**
 * Uniform Lucide icon for page/section headings.
 * Prefer this over ad-hoc `h-4`/`h-5`/`text-primary` mixes.
 */
export function SectionIcon({
  icon: Icon,
  variant = "section",
  className,
}: SectionIconProps) {
  if (variant === "group") {
    return (
      <span
        className={cn(
          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
          className,
        )}
      >
        <Icon className={ICON_CLASS.group} aria-hidden />
      </span>
    );
  }

  return <Icon className={cn(ICON_CLASS[variant], className)} aria-hidden />;
}
