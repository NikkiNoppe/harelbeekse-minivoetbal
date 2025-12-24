import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import PageHeader from "./page-header";
import { cn } from "@/lib/utils";

interface ActionConfig {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

interface SingleActionScreenProps {
  title: string;
  subtitle?: string;
  backPath?: string;
  backLabel?: string;
  primaryAction?: ActionConfig;
  secondaryAction?: ActionConfig;
  children: React.ReactNode;
  className?: string;
}

const SingleActionScreen: React.FC<SingleActionScreenProps> = ({
  title,
  subtitle,
  backPath,
  backLabel,
  primaryAction,
  secondaryAction,
  children,
  className
}) => {
  return (
    <div className={cn("flex flex-col min-h-full", className)}>
      {/* Header */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        backPath={backPath}
        backLabel={backLabel}
      />

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Action buttons - sticky at bottom on mobile */}
      {(primaryAction || secondaryAction) && (
        <div className="sticky bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border mt-6 -mx-4 sm:relative sm:bottom-auto sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:mx-0 sm:mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant || "outline"}
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled || secondaryAction.loading}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                variant={primaryAction.variant || "default"}
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {primaryAction.loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Laden...
                  </span>
                ) : (
                  primaryAction.label
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SingleActionScreen);
