
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { MatchFormData } from "../types";
import { enhancedMatchService } from "@/services/enhancedMatchService";
import { useToast } from "@/hooks/use-toast";

interface MatchDataSectionProps {
  match: MatchFormData;
  homeScore: string;
  awayScore: string;
  selectedReferee: string;
  onHomeScoreChange: (value: string) => void;
  onAwayScoreChange: (value: string) => void;
  onRefereeChange: (value: string) => void;
  canEdit: boolean;
  canEditMatchData: boolean;
}

const MOCK_REFEREES = [
  { id: 1, name: "Jan Janssen" },
  { id: 2, name: "Marie Pieters" },
  { id: 3, name: "Tom Van Der Berg" },
  { id: 4, name: "Lisa Vermeulen" }
];

export const MatchDataSection: React.FC<MatchDataSectionProps> = ({
  match,
  homeScore,
  awayScore,
  selectedReferee,
  onHomeScoreChange,
  onAwayScoreChange,
  onRefereeChange,
  canEdit,
  canEditMatchData
}) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [formData, setFormData] = React.useState({
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
      <h3 className="text-2xl text-center text-purple-light">
        ⚽ Wedstrijdgegevens
      </h3>
      
      {/* Match Details - 2 rows layout */}
      <div className="space-y-4">
        {/* First row: Date, Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="match-date">Datum</Label>
            <Input
              id="match-date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              disabled={!canEdit}
              className="input-login-style"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="match-time">Tijd</Label>
            <Input
              id="match-time"
              type="time"
              value={formData.time}
              onChange={(e) => handleInputChange("time", e.target.value)}
              disabled={!canEdit}
              className="input-login-style"
            />
          </div>
        </div>

        {/* Second row: Location, Matchday, Referee */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="match-location">Locatie</Label>
            <Input
              id="match-location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              disabled={!canEdit}
              placeholder="Wedstrijdlocatie"
              className="input-login-style"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="match-matchday">Speeldag</Label>
            <Input
              id="match-matchday"
              value={formData.matchday}
              onChange={(e) => handleInputChange("matchday", e.target.value)}
              disabled={!canEdit}
              placeholder="bijv. 11"
              className="input-login-style text-center"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="match-referee">Scheidsrechter</Label>
            <Select
              value={selectedReferee}
              onValueChange={onRefereeChange}
              disabled={!canEdit || !canEditMatchData}
            >
              <SelectTrigger className="dropdown-login-style text-right">
                <SelectValue placeholder="Selecteer scheidsrechter" />
              </SelectTrigger>
              <SelectContent className="dropdown-content-login-style">
                {MOCK_REFEREES.map((referee) => (
                  <SelectItem
                    key={referee.id}
                    value={referee.name}
                    className="dropdown-item-login-style"
                  >
                    {referee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Score Input */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="homeScore" className="font-semibold">{match.homeTeamName}</Label>
          <Input
            id="homeScore"
            type="number"
            min="0"
            value={homeScore}
            onChange={(e) => onHomeScoreChange(e.target.value)}
            disabled={!canEdit || !canEditMatchData}
            className="text-center text-lg font-bold input-login-style"
          />
        </div>
        
        <div className="flex justify-center items-center">
          <span className="text-3xl font-bold text-[var(--main-color-dark)]">-</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="awayScore" className="font-semibold">{match.awayTeamName}</Label>
          <Input
            id="awayScore"
            type="number"
            min="0"
            value={awayScore}
            onChange={(e) => onAwayScoreChange(e.target.value)}
            disabled={!canEdit || !canEditMatchData}
            className="text-center text-lg font-bold input-login-style"
          />
        </div>
      </div>

      {/* Save Button */}
      {canEdit && (
        <Button
          onClick={handleSave}
          disabled={isUpdating}
          className="btn-login-primary"
        >
          <Save className="h-4 w-4 mr-2" />
          {isUpdating ? "Opslaan..." : "Wedstrijdgegevens opslaan"}
        </Button>
      )}
    </div>
  );
};
