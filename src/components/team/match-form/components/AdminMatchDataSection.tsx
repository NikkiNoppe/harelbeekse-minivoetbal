
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import { MatchFormData } from "../types";
import { teamService, Team } from "@/services/teamService";
import { matchService } from "@/services/matchService";

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
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchdays, setMatchdays] = useState<{ matchday_id: number; name: string }[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    date: match.date,
    time: match.time,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    location: match.location,
    matchdayId: match.matchdayId || 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsData, matchdaysData] = await Promise.all([
          teamService.getAllTeams(),
          matchService.getMatchdays()
        ]);
        setTeams(teamsData);
        setMatchdays(matchdaysData);
      } catch (error) {
        toast({
          title: "Fout bij laden gegevens",
          description: "Er is een fout opgetreden bij het laden van teams en speeldagen.",
          variant: "destructive",
        });
      }
    };

    if (isEditing) {
      loadData();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!editData.date || !editData.time || !editData.homeTeamId || !editData.awayTeamId || !editData.location || !editData.matchdayId) {
      toast({
        title: "Validatie fout",
        description: "Vul alle velden in.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await matchService.updateMatchMetadata({
        matchId: match.matchId,
        date: editData.date,
        time: editData.time,
        homeTeamId: editData.homeTeamId,
        awayTeamId: editData.awayTeamId,
        location: editData.location,
        matchdayId: editData.matchdayId
      });

      const homeTeam = teams.find(t => t.team_id === editData.homeTeamId);
      const awayTeam = teams.find(t => t.team_id === editData.awayTeamId);
      const matchday = matchdays.find(m => m.matchday_id === editData.matchdayId);

      const updatedMatch: MatchFormData = {
        ...match,
        date: editData.date,
        time: editData.time,
        homeTeamId: editData.homeTeamId,
        homeTeamName: homeTeam?.team_name || "Onbekend",
        awayTeamId: editData.awayTeamId,
        awayTeamName: awayTeam?.team_name || "Onbekend",
        location: editData.location,
        matchdayId: editData.matchdayId,
        matchday: matchday?.name || `Speeldag ${editData.matchdayId}`
      };

      onMatchUpdate(updatedMatch);
      setIsEditing(false);

      toast({
        title: "Wedstrijd bijgewerkt",
        description: "De wedstrijdgegevens zijn succesvol bijgewerkt.",
      });
    } catch (error) {
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het bijwerken van de wedstrijd.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      date: match.date,
      time: match.time,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      location: match.location,
      matchdayId: match.matchdayId || 0
    });
    setIsEditing(false);
  };

  if (!canEdit) {
    return null;
  }

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader className="pb-4 bg-orange-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Admin: Wedstrijd Gegevens
          </CardTitle>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              Bewerken
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Datum:</strong> {match.date}</div>
            <div><strong>Tijd:</strong> {match.time}</div>
            <div><strong>Locatie:</strong> {match.location}</div>
            <div><strong>Speeldag:</strong> {match.matchday}</div>
            <div><strong>Thuisteam:</strong> {match.homeTeamName}</div>
            <div><strong>Uitteam:</strong> {match.awayTeamName}</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-date">Datum</Label>
                <Input
                  id="admin-date"
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-time">Tijd</Label>
                <Input
                  id="admin-time"
                  type="time"
                  value={editData.time}
                  onChange={(e) => setEditData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-location">Locatie</Label>
              <Input
                id="admin-location"
                value={editData.location}
                onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Bijv. Sporthal De Brug"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-matchday">Speeldag</Label>
              <Select
                value={editData.matchdayId.toString()}
                onValueChange={(value) => setEditData(prev => ({ ...prev, matchdayId: parseInt(value) }))}
              >
                <SelectTrigger id="admin-matchday">
                  <SelectValue placeholder="Selecteer speeldag" />
                </SelectTrigger>
                <SelectContent>
                  {matchdays.map((matchday) => (
                    <SelectItem key={matchday.matchday_id} value={matchday.matchday_id.toString()}>
                      {matchday.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-home-team">Thuisteam</Label>
                <Select
                  value={editData.homeTeamId.toString()}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, homeTeamId: parseInt(value) }))}
                >
                  <SelectTrigger id="admin-home-team">
                    <SelectValue placeholder="Selecteer thuisteam" />
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
              <div className="space-y-2">
                <Label htmlFor="admin-away-team">Uitteam</Label>
                <Select
                  value={editData.awayTeamId.toString()}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, awayTeamId: parseInt(value) }))}
                >
                  <SelectTrigger id="admin-away-team">
                    <SelectValue placeholder="Selecteer uitteam" />
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

            <div className="flex justify-end gap-2">
              <Button onClick={handleCancel} variant="outline" disabled={isLoading}>
                Annuleren
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Opslaan..." : "Opslaan"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
