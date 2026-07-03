import React from "react";
import { CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MatchFormSectionCard } from "@/components/modals/matches/MatchFormSectionCard";

export interface MatchFormNotesSectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showRefereeFields: boolean;
  canEdit: boolean;
  refereeNotes: string;
  onRefereeNotesChange: (value: string) => void;
}

export function MatchFormNotesSection({
  open,
  onOpenChange,
  showRefereeFields,
  canEdit,
  refereeNotes,
  onRefereeNotesChange,
}: MatchFormNotesSectionProps) {
  if (!showRefereeFields) return null;

  return (
    <MatchFormSectionCard open={open} onOpenChange={onOpenChange} title="Notities">
      <CardContent className="pt-4">
        <div className="space-y-2">
          <Textarea
            id="referee-notes"
            value={refereeNotes}
            onChange={(e) => onRefereeNotesChange(e.target.value)}
            disabled={!canEdit}
            placeholder="Voeg hier eventuele notities toe..."
            className="input-login-style min-h-[120px]"
          />
        </div>
      </CardContent>
    </MatchFormSectionCard>
  );
}
