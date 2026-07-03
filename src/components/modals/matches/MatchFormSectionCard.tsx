import React from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MatchFormSectionCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  children: React.ReactNode;
  contentId?: string;
  contentClassName?: string;
  trailing?: React.ReactNode;
  /** Compact header + tighter padding for dense forms (e.g. Wedstrijdinfo) */
  compact?: boolean;
}

export function MatchFormSectionCard({
  open,
  onOpenChange,
  title,
  children,
  contentId,
  contentClassName,
  trailing,
  compact = false,
}: MatchFormSectionCardProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card className="overflow-hidden border-primary/20 shadow-lg transition-shadow duration-300 card-hover">
        <CollapsibleTrigger asChild>
          <CardHeader
            className={cn(
              "flex cursor-pointer items-center transition-colors hover:bg-muted/40 data-[state=open]:bg-muted/60",
              compact ? "min-h-[44px] px-3 py-2.5 sm:px-4" : "min-h-[61px] px-5 py-4",
            )}
          >
            <div className="flex w-full items-center justify-between gap-3">
              <CardTitle className="m-0 flex items-center gap-2 text-sm font-semibold text-[var(--color-700)]">
                {title}
              </CardTitle>
              <div className="flex items-center gap-2">
                {trailing}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150",
                    open && "rotate-180",
                  )}
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent
          id={contentId}
          className={cn("border-t border-primary/15", contentClassName)}
        >
          {children}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
