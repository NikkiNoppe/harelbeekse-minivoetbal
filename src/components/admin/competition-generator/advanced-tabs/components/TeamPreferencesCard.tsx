
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Users, Calendar, Clock, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TeamPreference } from "../../types-advanced";
import { VENUES } from "@/constants/competitionData";

interface TeamPreferencesCardProps {
  selectedTeams: number[];
  teamPreferences: TeamPreference[];
  setTeamPreferences: (preferences: TeamPreference[]) => void;
}

const TeamPreferencesCard: React.FC<TeamPreferencesCardProps> = ({
  selectedTeams,
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
      return data;
    }
  });

  // Use hardcoded venues
  const venues = VENUES;

  const playDays = [
    { value: 1, label: 'Maandag' },
    { value: 2, label: 'Dinsdag' }
  ];

  const updateTeamPreference = (teamId: number, field: keyof TeamPreference, value: any) => {
    setTeamPreferences(teamPreferences.map(pref => 
      pref.team_id === teamId 
        ? { ...pref, [field]: value }
        : pref
    ));
  };

  if (selectedTeams.length === 0) {
    return null;
  }

  return (
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
                {team?.team_name}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Voorkeur locatie</Label>
                  <Select 
                    value={preferences.preferred_location || ''} 
                    onValueChange={(value) => 
                      updateTeamPreference(teamId, 'preferred_location', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer locatie" />
                    </SelectTrigger>
                    <SelectContent>
                      {venues.map(venue => (
                        <SelectItem key={venue.venue_id} value={venue.name}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Voorkeur dag
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
                      {playDays.map(day => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Voorkeur tijdslot
                  </Label>
                  <Select 
                    value={preferences.preferred_time_slot || ''} 
                    onValueChange={(value) => 
                      updateTeamPreference(teamId, 'preferred_time_slot', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer tijd" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18:30">Vroeg (18:30)</SelectItem>
                      <SelectItem value="19:00">Vroeg (19:00)</SelectItem>
                      <SelectItem value="19:30">Laat (19:30)</SelectItem>
                      <SelectItem value="20:00">Laat (20:00)</SelectItem>
                      <SelectItem value="20:30">Laat (20:30)</SelectItem>
                      <SelectItem value="21:00">Laat (21:00)</SelectItem>
                      <SelectItem value="21:30">Laat (21:30)</SelectItem>
                    </SelectContent>
                  </Select>
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
  );
};

export default TeamPreferencesCard;
