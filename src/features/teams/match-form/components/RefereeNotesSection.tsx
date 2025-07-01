
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Textarea } from "@shared/components/ui/textarea";
import { Label } from "@shared/components/ui/label";

interface RefereeNotesSectionProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  canEdit: boolean;
}

export const RefereeNotesSection: React.FC<RefereeNotesSectionProps> = ({
  notes,
  onNotesChange,
  canEdit
}) => {
  return (
    <Card className="border-2" style={{ borderColor: "var(--purple-200)" }}>
      <CardHeader style={{ background: "var(--main-color-dark)" }} className="rounded-t-lg">
        <CardTitle className="text-base text-white">Scheidsrechter Opmerkingen</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div>
          <Label htmlFor="referee-notes">Opmerkingen</Label>
          <Textarea
            id="referee-notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            disabled={!canEdit}
            rows={4}
            placeholder="Voer hier eventuele opmerkingen in..."
          />
        </div>
      </CardContent>
    </Card>
  );
};
