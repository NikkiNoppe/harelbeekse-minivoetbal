import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  "aria-label"?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = "md",
  "aria-label": ariaLabel = "Laden...",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn("flex items-center justify-center min-h-screen", className)}
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
    >
      <div className="flex items-center space-x-2 text-primary">
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-muted border-t-primary",
            sizeClasses[size]
          )}
          style={{
            animationDuration: "var(--transition-slow)",
          }}
        />
        <span className="text-body">Laden...</span>
      </div>
    </div>
  );
};

