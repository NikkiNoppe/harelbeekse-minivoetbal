
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, Settings, MapPin, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TeamPreference, Team } from "../types-advanced";

interface TeamsPreferencesTabProps {
  selectedTeams: number[];
  setSelectedTeams: (teams: number[]) => void;
  teamPreferences: TeamPreference[];
  setTeamPreferences: (preferences: TeamPreference[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const TeamsPreferencesTab: React.FC<TeamsPreferencesTabProps> = ({
  selectedTeams,
  setSelectedTeams,
  teamPreferences,
  setTeamPreferences,
  onNext,
  onPrevious
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
      // Add default preferences for new team
      setTeamPreferences([
        ...teamPreferences,
        { team_id: teamId }
      ]);
    } else {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
      setTeamPreferences(teamPreferences.filter(pref => pref.team_id !== teamId));
    }
  };

  const updateTeamPreference = (teamId: number, field: keyof TeamPreference, value: any) => {
    setTeamPreferences(teamPreferences.map(pref => 
      pref.team_id === teamId 
        ? { ...pref, [field]: value }
        : pref
    ));
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
    return days[dayNumber];
  };

  const isValid = selectedTeams.length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Teams & Voorkeuren</h3>
      </div>

      <div className="grid gap-6">
        {/* Team selectie */}
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
                  <Label htmlFor={`team-${team.team_id}`} className="team-name-container">
                    <span className="team-name-text text-responsive-team">{team.team_name}</span>
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Geselecteerd: {selectedTeams.length} teams
            </p>
          </CardContent>
        </Card>

        {/* Team voorkeuren */}
        {selectedTeams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Team Voorkeuren
              </CardTitle>
              <CardDescription>
                Configureer voorkeuren per team voor optimale planning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedTeams.map((teamId) => {
                const team = teams.find(t => t.team_id === teamId);
                const preferences = teamPreferences.find(p => p.team_id === teamId) || { team_id: teamId };

                return (
                  <div key={teamId} className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="text-responsive-card-title">{team?.team_name}</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Voorkeur thuiswedstrijden
                        </Label>
                        <Select 
                          value={preferences.preferred_home_day?.toString() || ''} 
                          onValueChange={(value) => 
                            updateTeamPreference(teamId, 'preferred_home_day', value ? parseInt(value) : undefined)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer dag" />
                          </SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3, 4, 5, 6].map(day => (
                              <SelectItem key={day} value={day.toString()}>
                                {getDayName(day)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Voorkeur tijdslot</Label>
                        <Input
                          type="time"
                          value={preferences.preferred_time_slot || ''}
                          onChange={(e) => 
                            updateTeamPreference(teamId, 'preferred_time_slot', e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Max reisafstand (km)
                        </Label>
                        <Input
                          type="number"
                          placeholder="Bijv. 50"
                          value={preferences.max_travel_distance || ''}
                          onChange={(e) => 
                            updateTeamPreference(teamId, 'max_travel_distance', parseInt(e.target.value) || undefined)
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Extra opmerkingen</Label>
                      <Textarea
                        placeholder="Bijv. Niet beschikbaar op feestdagen..."
                        value={preferences.notes || ''}
                        onChange={(e) => 
                          updateTeamPreference(teamId, 'notes', e.target.value)
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Vorige: Planning
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Volgende: AI Generatie
        </Button>
      </div>
    </div>
  );
};

export default TeamsPreferencesTab;
