import React from "react";
import { Textarea } from "../../../MINIVOETBAL.UI/components/ui/textarea";

interface RefereeNotesSectionProps {
  refereeNotes: string;
  onRefereeNotesChange: (value: string) => void;
  canEdit: boolean;
}

export const RefereeNotesSection: React.FC<RefereeNotesSectionProps> = ({
  refereeNotes,
  onRefereeNotesChange,
  canEdit
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl text-center text-purple-light">Notities scheidsrechter</h3>
      
      <Textarea
        value={refereeNotes}
        onChange={(e) => onRefereeNotesChange(e.target.value)}
        disabled={!canEdit}
        placeholder="Bijzonderheden, opmerkingen..."
        rows={4}
        className="focus:border-[var(--main-color-dark)] focus:ring-[var(--main-color-dark)]"
      />
    </div>
  );
};
