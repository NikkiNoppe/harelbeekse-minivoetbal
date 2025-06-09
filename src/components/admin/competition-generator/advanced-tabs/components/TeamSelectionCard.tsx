
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Team, TeamPreference } from "../../types-advanced";

interface TeamSelectionCardProps {
  selectedTeams: number[];
  setSelectedTeams: (teams: number[]) => void;
  teamPreferences: TeamPreference[];
  setTeamPreferences: (preferences: TeamPreference[]) => void;
}

const TeamSelectionCard: React.FC<TeamSelectionCardProps> = ({
  selectedTeams,
  setSelectedTeams,
  teamPreferences,
  setTeamPreferences
}) => {
  // Fetch teams
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');
      
      if (error) throw error;
      return data as Team[];
    }
  });

  const handleTeamToggle = (teamId: number, checked: boolean) => {
    if (checked) {
      setSelectedTeams([...selectedTeams, teamId]);
      setTeamPreferences([
        ...teamPreferences,
        { team_id: teamId }
      ]);
    } else {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
      setTeamPreferences(teamPreferences.filter(pref => pref.team_id !== teamId));
    }
  };

  const selectAllTeams = () => {
    const allTeamIds = teams.map(team => team.team_id);
    setSelectedTeams(allTeamIds);
    setTeamPreferences(allTeamIds.map(id => ({ team_id: id })));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          Team Selectie
        </CardTitle>
        <CardDescription>
          Selecteer de teams die deelnemen aan deze competitie
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Button variant="outline" onClick={selectAllTeams} size="sm">
            Alles selecteren
          </Button>
          <span className="text-sm text-muted-foreground">
            Geselecteerd: {selectedTeams.length} teams
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {teams.map((team) => (
            <div key={team.team_id} className="flex items-center space-x-2">
              <Checkbox
                id={`team-${team.team_id}`}
                checked={selectedTeams.includes(team.team_id)}
                onCheckedChange={(checked) => 
                  handleTeamToggle(team.team_id, checked as boolean)
                }
              />
              <Label htmlFor={`team-${team.team_id}`}>
                {team.team_name}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamSelectionCard;
