import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ClipboardList, ChevronDown } from "lucide-react";
import { useProfilePolls } from "@/hooks/useProfilePolls";
import { ProfilePollRespondentCard } from "./ProfilePollRespondentCard";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfilePollRespondentCollapsibleProps {
  enabled?: boolean;
}

export function ProfilePollRespondentCollapsible({
  enabled = true,
}: ProfilePollRespondentCollapsibleProps) {
  const { respondentPolls, isLoading, isFetched } = useProfilePolls({
    isAdmin: false,
    enabled,
  });

  if (!enabled) return null;

  if (isLoading) {
    return (
      <Collapsible defaultOpen>
        <Card className="border-primary/20">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
                  Enquêtes
                </CardTitle>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-6 pb-4">
              <Skeleton className="h-24 w-full" />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  if (!isFetched || respondentPolls.length === 0) {
    return null;
  }

  return (
    <Collapsible defaultOpen>
      <Card className="border-primary/20">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
                Enquêtes
                <span className="text-xs font-normal text-muted-foreground">
                  ({respondentPolls.length})
                </span>
              </CardTitle>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-0 pb-4 space-y-3">
            {respondentPolls.map((poll) => (
              <div key={poll.id} className="px-4 sm:px-6">
                <ProfilePollRespondentCard poll={poll} />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
