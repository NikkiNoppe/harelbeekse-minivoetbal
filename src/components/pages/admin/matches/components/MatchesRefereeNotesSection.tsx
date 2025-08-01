import React, { useCallback, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RefereeNotesSectionProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  canEdit: boolean;
}

const MatchesRefereeNotesSection: React.FC<RefereeNotesSectionProps> = ({
  notes,
  onNotesChange,
  canEdit,
}) => {
  // Memoize the notes change handler
  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNotesChange(e.target.value);
  }, [onNotesChange]);

  // Memoize the component to prevent unnecessary re-renders
  const notesValue = useMemo(() => notes, [notes]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-purple-light">
        📝 Scheidsrechter Notities
      </h3>
      <div className="space-y-2">
        <Label htmlFor="referee-notes">Notities</Label>
        <Textarea
          id="referee-notes"
          value={notesValue}
          onChange={handleNotesChange}
          disabled={!canEdit}
          placeholder="Voeg hier eventuele notities toe..."
          className="min-h-[120px] input-login-style"
        />
      </div>
    </div>
  );
};

export default React.memo(MatchesRefereeNotesSection);
