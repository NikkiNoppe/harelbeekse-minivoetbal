import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Users } from "lucide-react";
import {
  SectionCollapsibleCard,
  useProfileAccordionItem,
} from "@/components/layout";
import { TeamManagerSpelersPanel } from "@/components/pages/admin/players/TeamManagerSpelersPanel";

interface ProfileTeamPlayersCardProps {
  teamId: number;
  teamName?: string;
  accordionValue?: string;
  onRequestOpen?: () => void;
}

export function ProfileTeamPlayersCard({
  teamId,
  teamName,
  accordionValue = "spelers",
  onRequestOpen,
}: ProfileTeamPlayersCardProps) {
  const location = useLocation();
  const isOpen = useProfileAccordionItem(accordionValue);

  useEffect(() => {
    if (location.hash === "#spelers") {
      onRequestOpen?.();
      const timer = window.setTimeout(() => {
        document
          .getElementById("profile-spelers")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return () => window.clearTimeout(timer);
    }
  }, [location.hash, onRequestOpen]);

  return (
    <SectionCollapsibleCard
      id="profile-spelers"
      itemClassName="scroll-mt-24"
      accordionValue={accordionValue}
      title="Spelers"
      icon={Users}
      contentClassName="!p-0"
    >
      {isOpen ? (
        <TeamManagerSpelersPanel
          teamId={teamId}
          teamName={teamName}
          embedded
        />
      ) : null}
    </SectionCollapsibleCard>
  );
}
