
import React, { useState } from "react";
import { Input } from "../../../MINIVOETBAL.UI/components/ui/input";
import { Label } from "../../../MINIVOETBAL.UI/components/ui/label";
import { Button } from "../../../MINIVOETBAL.UI/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "../../../MINIVOETBAL.UI/hooks/use-toast";
import { MatchFormData } from "../types";
import { enhancedMatchService } from "../../../../services/match";

interface AdminMatchDataSectionProps {
  match: MatchFormData;
  onMatchUpdate: (match: MatchFormData) => void;
  canEdit: boolean;
}

export const AdminMatchDataSection: React.FC<AdminMatchDataSectionProps> = ({
  match,
  onMatchUpdate,
  canEdit
}) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    date: match.date,
    time: match.time,
    location: match.location,
    matchday: match.matchday
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!canEdit) return;

    setIsUpdating(true);
    try {
      const result = await enhancedMatchService.updateMatch(match.matchId, {
        date: formData.date,
        time: formData.time,
        location: formData.location,
        matchday: formData.matchday
      });

      if (result.success) {
        const updatedMatch = {
          ...match,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          matchday: formData.matchday
        };

        onMatchUpdate(updatedMatch);

        toast({
          title: "Wedstrijdgegevens bijgewerkt",
          description: "De wedstrijdgegevens zijn succesvol opgeslagen.",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Fout bij opslaan",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden bij het opslaan van de wedstrijdgegevens.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-2xl text-center text-purple-light">Admin: Wedstrijdgegevens</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="admin-date">Datum</Label>
            <Input
              id="admin-date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="admin-time">Tijd</Label>
            <Input
              id="admin-time"
              type="time"
              value={formData.time}
              onChange={(e) => handleInputChange("time", e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-location">Locatie</Label>
          <Input
            id="admin-location"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            disabled={!canEdit}
            placeholder="Wedstrijdlocatie"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-matchday">Speeldag</Label>
          <Input
            id="admin-matchday"
            value={formData.matchday}
            onChange={(e) => handleInputChange("matchday", e.target.value)}
            disabled={!canEdit}
            placeholder="bijv. 11"
          />
        </div>

        {canEdit && (
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isUpdating ? "Opslaan..." : "Wedstrijdgegevens Opslaan"}
          </Button>
        )}
      </div>
    </div>
  );
};
