
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeamFormProps {
  onAddTeam: (name: string) => void;
  initialName?: string;
  isEditing?: boolean;
  onCancel?: () => void;
}

const TeamForm: React.FC<TeamFormProps> = ({ 
  onAddTeam, 
  initialName = "", 
  isEditing = false,
  onCancel
}) => {
  const [teamName, setTeamName] = useState(initialName);

  // Update the team name when initialName changes (for editing)
  useEffect(() => {
    setTeamName(initialName);
  }, [initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      onAddTeam(teamName.trim());
      setTeamName("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <div className="space-y-2 flex-1">
        <Label htmlFor="team-name">
          {isEditing ? "Bewerk team naam" : "Team naam"}
        </Label>
        <Input
          id="team-name"
          placeholder="Voer team naam in"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
      </div>
      <div className="self-end flex gap-2">
        {isEditing && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Annuleren
          </Button>
        )}
        <Button type="submit">
          {isEditing ? "Opslaan" : "Team toevoegen"}
        </Button>
      </div>
    </form>
  );
};

export default TeamForm;
