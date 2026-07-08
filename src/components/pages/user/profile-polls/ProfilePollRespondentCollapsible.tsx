import React from "react";
import { ClipboardList } from "lucide-react";
import { useProfilePolls } from "@/hooks/useProfilePolls";
import { ProfilePollRespondentCard } from "./ProfilePollRespondentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCollapsibleCard } from "@/components/layout";

interface ProfilePollRespondentCollapsibleProps {
  enabled?: boolean;
  accordionValue?: string;
}

export function ProfilePollRespondentCollapsible({
  enabled = true,
  accordionValue = "polls",
}: ProfilePollRespondentCollapsibleProps) {
  const { respondentPolls, isLoading } = useProfilePolls({
    isAdmin: false,
    enabled,
  });

  if (!enabled) return null;

  if (isLoading) {
    return (
      <SectionCollapsibleCard
        title="Enquêtes"
        icon={ClipboardList}
        accordionValue={accordionValue}
        contentClassName="space-y-3"
      >
        <Skeleton className="h-24 w-full" />
      </SectionCollapsibleCard>
    );
  }

  if (respondentPolls.length === 0) {
    return null;
  }

  return (
    <SectionCollapsibleCard
      title="Enquêtes"
      icon={ClipboardList}
      accordionValue={accordionValue}
      badge={
        <span className="text-xs font-normal text-muted-foreground">
          ({respondentPolls.length})
        </span>
      }
      contentClassName="space-y-3"
    >
      {respondentPolls.map((poll) => (
        <ProfilePollRespondentCard key={poll.id} poll={poll} />
      ))}
    </SectionCollapsibleCard>
  );
}
