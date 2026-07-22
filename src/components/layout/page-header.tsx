import React, { memo, type ComponentType, type SVGProps } from "react";
import { useOrgAwareNavigate } from "@/hooks/useOrgAwareNavigate";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/hooks/useOrganization";
import { SectionIcon } from "./section-icon";

type PageHeaderIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optioneel pagina-icoon — zelfde SectionIcon-styling overal */
  icon?: PageHeaderIcon;
  backPath?: string;
  backLabel?: string;
  rightAction?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  backPath,
  backLabel = "Terug",
  rightAction,
  className
}) => {
  const navigate = useOrgAwareNavigate();
  const { organizationSlug } = useOrganization();
  const useAccentBar = organizationSlug === "kuurne";

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn("mb-6", className)}>
      <div className={cn(
        "mb-2",
        backPath !== undefined ? "flex items-center justify-between" : rightAction ? "w-full" : ""
      )}>
        {backPath !== undefined ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground -ml-2 h-8 px-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span className="text-sm">{backLabel}</span>
          </Button>
        ) : null}
        
        {rightAction && (
          <div className={backPath === undefined ? "w-full" : ""}>
            {rightAction}
          </div>
        )}
      </div>

      <div
        className={cn(
          useAccentBar &&
            "bg-warning -mx-4 px-4 py-3 sm:mx-0 sm:rounded-md",
        )}
      >
        <h1
          className={cn(
            "flex items-center gap-2.5",
            useAccentBar
              ? "text-base sm:text-lg font-bold text-black leading-tight"
              : "text-2xl font-bold leading-tight text-[var(--color-700)]",
          )}
        >
          {icon ? (
            <SectionIcon
              icon={icon}
              className={useAccentBar ? "text-black" : undefined}
            />
          ) : null}
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              "text-sm mt-1",
              useAccentBar ? "text-black/80" : "text-muted-foreground",
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default memo(PageHeader);
