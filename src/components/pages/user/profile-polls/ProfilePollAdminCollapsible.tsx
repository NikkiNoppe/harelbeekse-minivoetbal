import React, { useRef } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ClipboardList, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ProfilePollAdminSection,
  type ProfilePollAdminSectionHandle,
} from "./ProfilePollAdminSection";

export function ProfilePollAdminCollapsible() {
  const sectionRef = useRef<ProfilePollAdminSectionHandle>(null);

  return (
    <Collapsible defaultOpen>
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <CollapsibleTrigger className="group flex w-full min-w-0 flex-1 items-center justify-between gap-3 min-h-[44px] rounded-lg px-1 -mx-1 transition-colors hover:bg-muted/30">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-primary" />
                <span className="truncate">Profielpolls</span>
              </CardTitle>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-11 min-h-[44px] w-full shrink-0 rounded-lg sm:w-auto",
                "border-primary/30 bg-card text-[var(--color-600)] font-medium shadow-sm",
                "hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                "active:bg-primary/10",
              )}
              onClick={(e) => {
                e.stopPropagation();
                sectionRef.current?.openCreateModal();
              }}
            >
              <Plus className="h-4 w-4 mr-2 shrink-0" />
              Nieuwe poll
            </Button>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <ProfilePollAdminSection ref={sectionRef} />
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
