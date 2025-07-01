import React, { useState } from "react";
import { Lock, Unlock, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Button } from "@shared/components/ui/button";
import { MatchFormData } from "../types";
import { toast } from "@shared/hooks/use-toast";
import { matchService } from "@shared/services/matchService";

interface AdminMatchDataSectionProps {
  match: MatchFormData;
  onMatchUpdate: (matchId: number, updates: Partial<MatchFormData>) => Promise<void>;
  isSaving: boolean;
  canEdit: boolean;
  onLockToggle: (matchId: number) => Promise<void>;
}

export const AdminMatchDataSection: React.FC<AdminMatchDataSectionProps> = ({
  match,
  onMatchUpdate,
  isSaving,
  canEdit,
  onLockToggle
}) => {
  const [fieldCost, setFieldCost] = useState<string>(match.fieldCost?.toString() || "");
  const [refereeCost, setRefereeCost] = useState<string>(match.refereeCost?.toString() || "");

  const handleSaveCosts = async () => {
    if (!match.matchId) {
      toast({
        title: "Fout",
        description: "Wedstrijd ID is niet beschikbaar.",
        variant: "destructive",
      });
      return;
    }

    const parsedFieldCost = parseFloat(fieldCost);
    const parsedRefereeCost = parseFloat(refereeCost);

    if (isNaN(parsedFieldCost) || isNaN(parsedRefereeCost)) {
      toast({
        title: "Fout",
        description: "Ongeldige kosten ingevoerd. Vul getallen in.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onMatchUpdate(match.matchId, {
        fieldCost: parsedFieldCost,
        refereeCost: parsedRefereeCost,
      });

      toast({
        title: "Succes",
        description: "Kosten succesvol opgeslagen!",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan van de kosten.",
        variant: "destructive",
      });
    }
  };

  const handleLockToggle = async () => {
    if (!match.matchId) {
      toast({
        title: "Fout",
        description: "Wedstrijd ID is niet beschikbaar.",
        variant: "destructive",
      });
      return;
    }

    await onLockToggle(match.matchId);
  };

  return (
    <Card className="border-2" style={{ borderColor: "var(--purple-200)" }}>
      <CardHeader style={{ background: "var(--main-color-dark)" }} className="rounded-t-lg">
        <CardTitle className="text-base text-white">Admin data</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <Label htmlFor="fieldCost">Veldkosten</Label>
          <Input
            id="fieldCost"
            type="number"
            value={fieldCost}
            onChange={(e) => setFieldCost(e.target.value)}
            disabled={isSaving || !canEdit}
            className="focus:border-[var(--main-color-dark)] focus:ring-[var(--main-color-dark)]"
          />
        </div>
        <div>
          <Label htmlFor="refereeCost">Scheidsrechterkosten</Label>
          <Input
            id="refereeCost"
            type="number"
            value={refereeCost}
            onChange={(e) => setRefereeCost(e.target.value)}
            disabled={isSaving || !canEdit}
            className="focus:border-[var(--main-color-dark)] focus:ring-[var(--main-color-dark)]"
          />
        </div>
        <div className="flex justify-between">
          <Button
            onClick={handleSaveCosts}
            disabled={isSaving || !canEdit}
            className="px-6"
            style={{
              background: "var(--main-color-dark)",
              color: "#fff",
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            Kosten opslaan
          </Button>
          <Button
            onClick={handleLockToggle}
            disabled={isSaving}
            className="px-6"
            style={{
              background: "var(--main-color-dark)",
              color: "#fff",
            }}
          >
            {match.isLocked ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Ontgrendel
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Vergrendel
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
