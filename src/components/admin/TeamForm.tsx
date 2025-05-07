
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeamFormProps {
  onAddTeam: (name: string) => void;
}

const TeamForm: React.FC<TeamFormProps> = ({ onAddTeam }) => {
  const [teamName, setTeamName] = useState("");

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
        <Label htmlFor="team-name">Team naam</Label>
        <Input
          id="team-name"
          placeholder="Voer team naam in"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
      </div>
      <Button type="submit" className="self-end">Team toevoegen</Button>
    </form>
  );
};

export default TeamForm;
