import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SCHEDULE_FILTER_TRIGGER } from "@/components/common/scheduleControlStyles";
import { cn } from "@/lib/utils";

interface FilterSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  width?: "full" | "half";
  className?: string;
  /** schedule = uniforme speelschema-styling zonder conflicterende base-styles */
  variant?: "default" | "schedule";
  /** Toon zichtbaar label boven de trigger (standaard aan bij variant schedule) */
  showLabel?: boolean;
  /** Optionele extra klassen op de SelectTrigger (alleen bij variant default) */
  triggerClassName?: string;
}

/**
 * FilterSelect - Consistent Select component with Label
 * 
 * Mobile-first component with automatic responsive layout:
 * - Always stacks vertically on mobile
 * - Can be placed in a grid container for side-by-side layout
 * 
 * @example
 * // Full width
 * <FilterSelect 
 *   label="Speeldag"
 *   value={selected}
 *   onValueChange={setSelected}
 *   options={[{ value: "1", label: "Speeldag 1" }]}
 * />
 * 
 * @example
 * // Side by side with grid
 * <div className="grid grid-cols-2 gap-3">
 *   <FilterSelect label="Speeldag" ... width="half" />
 *   <FilterSelect label="Divisie" ... width="half" />
 * </div>
 */
export const FilterSelect = React.forwardRef<HTMLButtonElement, FilterSelectProps>(
  ({ label, value, onValueChange, placeholder, options, width = "full", className, variant = "default", showLabel, triggerClassName }, ref) => {
    const isSchedule = variant === "schedule";
    const triggerId = React.useId();
    const visibleLabel = showLabel ?? isSchedule;

    return (
      <div className={cn("w-full", className)}>
        {visibleLabel && (
          <label
            htmlFor={triggerId}
            className="text-sm font-medium text-foreground mb-1.5 block"
          >
            {label}
          </label>
        )}
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger
            ref={ref}
            id={triggerId}
            variant={isSchedule ? "schedule" : "default"}
            aria-label={visibleLabel ? undefined : label}
            className={
              isSchedule
                ? SCHEDULE_FILTER_TRIGGER
                : cn(
                    "h-11 min-h-[44px] max-h-11 py-0 text-sm w-full rounded-lg",
                    triggerClassName,
                  )
            }
          >
            <SelectValue placeholder={placeholder || `Selecteer ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
);

FilterSelect.displayName = "FilterSelect";

/**
 * FilterGroup - Container for multiple filters
 * Automatically handles responsive layout
 * 
 * @example
 * <FilterGroup>
 *   <FilterSelect label="Speeldag" ... />
 *   <FilterSelect label="Divisie" ... />
 *   <FilterSelect label="Team" ... />
 * </FilterGroup>
 */
interface FilterGroupProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export const FilterGroup: React.FC<FilterGroupProps> = ({ 
  children, 
  columns = 1,
  className 
}) => {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
  }[columns];

  return (
    <div className={cn("grid gap-3", gridClass, className)}>
      {children}
    </div>
  );
};

FilterGroup.displayName = "FilterGroup";

