import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ProfilePollAdminSection,
  type ProfilePollAdminSectionHandle,
} from "./ProfilePollAdminSection";
import { SectionCollapsibleCard } from "@/components/layout";

export function ProfilePollAdminCollapsible({
  accordionValue = "admin-polls",
}: {
  accordionValue?: string;
}) {
  const sectionRef = useRef<ProfilePollAdminSectionHandle>(null);

  return (
    <SectionCollapsibleCard
      title="Profielpolls"
      icon={ClipboardList}
      accordionValue={accordionValue}
      contentClassName="pt-0"
      headerAction={
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-11 min-h-[44px] w-full shrink-0 rounded-lg sm:w-auto",
            "border-primary/30 bg-card text-[var(--color-600)] font-medium shadow-sm",
            "hover:border-primary/50 hover:bg-muted hover:text-primary",
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
      }
    >
      <ProfilePollAdminSection ref={sectionRef} />
    </SectionCollapsibleCard>
  );
}
