import React, { useState, useEffect } from "react";
import { MatchFormData } from "../types";
import { Label } from "@shared/components/ui/label";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { Button } from "@shared/components/ui/button";
import { toast } from "@shared/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@shared/components/ui/select";
import { teamService } from "@shared/services/teamService";

interface EditMatchFormProps {
  match: MatchFormData;
  onSave: (updatedMatch: MatchFormData) => void;
  onCancel: () => void;
}

const EditMatchForm: React.FC<EditMatchFormProps> = ({ match, onSave, onCancel }) => {
  const [formData, setFormData] = useState<MatchFormData>(match);
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const teamData = await teamService.getAllTeams();
      setTeams(teamData);
    } catch (error) {
      console.error("Error loading teams:", error);
      toast({
        title: "Failed to load teams",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    onSave(formData);
    toast({
      title: "Match updated successfully",
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="homeTeam">Home Team</Label>
        <Select
          value={formData.homeTeam}
          onValueChange={(value) => setFormData({ ...formData, homeTeam: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.team_id} value={team.team_name}>
                {team.team_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="awayTeam">Away Team</Label>
        <Select
          value={formData.awayTeam}
          onValueChange={(value) => setFormData({ ...formData, awayTeam: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.team_id} value={team.team_name}>
                {team.team_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="time">Time</Label>
        <Input
          id="time"
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="referee">Referee</Label>
        <Input
          id="referee"
          value={formData.referee || ""}
          onChange={(e) => setFormData({ ...formData, referee: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
};

export default EditMatchForm;
