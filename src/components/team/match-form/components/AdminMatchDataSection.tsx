
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MatchFormData } from "../types";
import { matchService, MatchMetadata } from "@/services/matchService";
import { teamService, Team } from "@/services/teamService";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface AdminMatchDataSectionProps {
  match: MatchFormData;
  onMatchUpdate: (updatedMatch: MatchFormData) => void;
  canEdit: boolean;
}

export const AdminMatchDataSection: React.FC<AdminMatchDataSectionProps> = ({
  match,
  onMatchUpdate,
  canEdit
}) => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    date: match.date,
    time: match.time,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    location: match.location,
    matchday: match.matchday
  });

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamsData = await teamService.getAllTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error("Error loading teams:", error);
        toast({
          title: "Fout bij laden teams",
          description: "Er is een fout opgetreden bij het laden van de teams.",
          variant: "destructive",
        });
      } finally {
        setLoadingTeams(false);
      }
    };

    loadTeams();
  }, [toast]);

  const handleSave = async () => {
    try {
      const metadata: MatchMetadata = {
        matchId: match.matchId,
        date: editData.date,
        time: editData.time,
        homeTeamId: editData.homeTeamId,
        awayTeamId: editData.awayTeamId,
        location: editData.location,
        matchday: editData.matchday
      };

      await matchService.updateMatchMetadata(metadata);

      // Find team names
      const homeTeam = teams.find(t => t.team_id === editData.homeTeamId);
      const awayTeam = teams.find(t => t.team_id === editData.awayTeamId);

      // Update local match data
      const updatedMatch: MatchFormData = {
        ...match,
        date: editData.date,
        time: editData.time,
        homeTeamId: editData.homeTeamId,
        homeTeamName: homeTeam?.team_name || "Onbekend",
        awayTeamId: editData.awayTeamId,
        awayTeamName: awayTeam?.team_name || "Onbekend",
        location: editData.location,
        matchday: editData.matchday
      };

      onMatchUpdate(updatedMatch);
      setIsEditing(false);

      toast({
        title: "Wedstrijd bijgewerkt",
        description: "De wedstrijdgegevens zijn succesvol bijgewerkt.",
      });
    } catch (error) {
      console.error("Error updating match:", error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van de wedstrijd.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditData({
      date: match.date,
      time: match.time,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      location: match.location,
      matchday: match.matchday
    });
    setIsEditing(false);
  };

  if (loadingTeams) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin: Wedstrijdgegevens</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Teams laden...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin: Wedstrijdgegevens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEditing ? (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Datum:</strong> {match.date}
              </div>
              <div>
                <strong>Tijd:</strong> {match.time}
              </div>
              <div>
                <strong>Thuisteam:</strong> {match.homeTeamName}
              </div>
              <div>
                <strong>Uitteam:</strong> {match.awayTeamName}
              </div>
              <div>
                <strong>Locatie:</strong> {match.location}
              </div>
              <div>
                <strong>Speeldag:</strong> {match.matchday}
              </div>
            </div>
            {canEdit && (
              <Button onClick={() => setIsEditing(true)}>
                Bewerken
              </Button>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date">Datum</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-time">Tijd</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editData.time}
                  onChange={(e) => setEditData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-home-team">Thuisteam</Label>
                <Select
                  value={editData.homeTeamId.toString()}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, homeTeamId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.team_id} value={team.team_id.toString()}>
                        {team.team_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-away-team">Uitteam</Label>
                <Select
                  value={editData.awayTeamId.toString()}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, awayTeamId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.team_id} value={team.team_id.toString()}>
                        {team.team_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-location">Locatie</Label>
              <Input
                id="edit-location"
                value={editData.location}
                onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-matchday">Speeldag</Label>
              <Input
                id="edit-matchday"
                value={editData.matchday}
                onChange={(e) => setEditData(prev => ({ ...prev, matchday: e.target.value }))}
                placeholder="bijv. Speeldag 1"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>
                Opslaan
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Annuleren
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
