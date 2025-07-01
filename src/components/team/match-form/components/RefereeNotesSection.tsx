
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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
    <Card className="border-2" style={{ borderColor: "var(--purple-200)", background: "var(--purple-200)" }}>
      <CardHeader style={{ background: "var(--main-color-dark)" }} className="rounded-t-lg">
        <CardTitle className="text-base text-white">Notities scheidsrechter</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={refereeNotes}
          onChange={(e) => onRefereeNotesChange(e.target.value)}
          disabled={!canEdit}
          placeholder="Bijzonderheden, opmerkingen..."
          rows={4}
          className="focus:border-[var(--main-color-dark)] focus:ring-[var(--main-color-dark)]"
        />
      </CardContent>
    </Card>
  );
};
