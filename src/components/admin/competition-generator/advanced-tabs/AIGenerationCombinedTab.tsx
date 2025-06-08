
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Bot, Zap, CheckCircle, AlertCircle, Users, Settings, MapPin, Clock, Calendar, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdvancedCompetitionConfig, TeamPreference, VacationPeriod, Team, AIGeneratedSchedule } from "../types-advanced";

interface AIGenerationCombinedTabProps {
  config: AdvancedCompetitionConfig;
  setConfig: (config: AdvancedCompetitionConfig) => void;
  selectedTeams: number[];
  setSelectedTeams: (teams: number[]) => void;
  teamPreferences: TeamPreference[];
  setTeamPreferences: (preferences: TeamPreference[]) => void;
  vacationPeriods: VacationPeriod[];
  setVacationPeriods: (periods: VacationPeriod[]) => void;
  isGenerating: boolean;
  onGenerate: (provider: 'openai' | 'abacus') => void;
  onNext: () => void;
  onPrevious: () => void;
  generatedSchedule?: AIGeneratedSchedule | null;
}

const AIGenerationCombinedTab: React.FC<AIGenerationCombinedTabProps> = ({
  config,
  setConfig,
  selectedTeams,
  setSelectedTeams,
  teamPreferences,
  setTeamPreferences,
  vacationPeriods,
  setVacationPeriods,
  isGenerating,
  onGenerate,
  onNext,
  onPrevious,
  generatedSchedule
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'abacus' | null>(null);

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

  // Default locations and time slots
  const defaultLocations = ['Harelbeke', 'Bavikhove'];
  const defaultTimeSlots = ['18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
  const playDays = [
    { value: 1, label: 'Maandag' },
    { value: 2, label: 'Dinsdag' }
  ];

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

  const updateTeamPreference = (teamId: number, field: keyof TeamPreference, value: any) => {
    setTeamPreferences(teamPreferences.map(pref => 
      pref.team_id === teamId 
        ? { ...pref, [field]: value }
        : pref
    ));
  };

  const addVacationPeriod = () => {
    const newPeriod: VacationPeriod = {
      id: Date.now(),
      name: '',
      start_date: '',
      end_date: ''
    };
    setVacationPeriods([...vacationPeriods, newPeriod]);
  };

  const removeVacationPeriod = (id: number) => {
    setVacationPeriods(vacationPeriods.filter(period => period.id !== id));
  };

  const updateVacationPeriod = (id: number, field: keyof VacationPeriod, value: string) => {
    setVacationPeriods(vacationPeriods.map(period =>
      period.id === id ? { ...period, [field]: value } : period
    ));
  };

  const handleGenerate = () => {
    if (selectedProvider) {
      onGenerate(selectedProvider);
    }
  };

  const isValid = selectedTeams.length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5" />
        <h3 className="text-lg font-semibold">AI Competitie Generator</h3>
      </div>

      {/* Competitie Planning */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Competitie Planning
          </CardTitle>
          <CardDescription>
            Configureer de basis instellingen voor het schema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Beschikbare locaties */}
          <div>
            <Label className="text-sm font-medium">Beschikbare locaties</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {defaultLocations.map((location) => (
                <div key={location} className="p-3 border rounded text-center bg-muted">
                  <MapPin className="w-4 h-4 mx-auto mb-1" />
                  {location}
                </div>
              ))}
            </div>
          </div>
          
          {/* Speeldagen */}
          <div>
            <Label className="text-sm font-medium">Beschikbare speeldagen</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {playDays.map((day) => (
                <div key={day.value} className="p-3 border rounded text-center bg-muted">
                  <Calendar className="w-4 h-4 mx-auto mb-1" />
                  {day.label}
                </div>
              ))}
            </div>
          </div>

          {/* Tijdstippen */}
          <div>
            <Label className="text-sm font-medium">Beschikbare tijdstippen</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {defaultTimeSlots.map((timeSlot) => (
                <div key={timeSlot} className="p-2 border rounded text-center bg-muted text-sm">
                  <Clock className="w-3 h-3 mx-auto mb-1" />
                  {timeSlot}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verlofperiodes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Verlofperiodes
          </CardTitle>
          <CardDescription>
            Definieer periodes waarin geen wedstrijden gepland worden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {vacationPeriods.map((period) => (
            <div key={period.id} className="flex items-center gap-2 p-3 border rounded">
              <Input
                placeholder="Naam periode (bijv. Kerstvakantie)"
                value={period.name}
                onChange={(e) => updateVacationPeriod(period.id, 'name', e.target.value)}
                className="flex-1"
              />
              <Input
                type="date"
                value={period.start_date}
                onChange={(e) => updateVacationPeriod(period.id, 'start_date', e.target.value)}
                className="w-36"
              />
              <Input
                type="date"
                value={period.end_date}
                onChange={(e) => updateVacationPeriod(period.id, 'end_date', e.target.value)}
                className="w-36"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeVacationPeriod(period.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            onClick={addVacationPeriod}
            className="w-full flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Verlofperiode toevoegen
          </Button>
        </CardContent>
      </Card>

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
                          {defaultLocations.map(location => (
                            <SelectItem key={location} value={location}>
                              {location}
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
      )}

      {/* AI Provider selectie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selecteer AI Service</CardTitle>
          <CardDescription>
            Kies welke AI service je wilt gebruiken voor het genereren van het schema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OpenAI */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedProvider === 'openai' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedProvider('openai')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Bot className="w-5 h-5" />
                <h4 className="font-medium">ChatGPT (OpenAI)</h4>
                <Badge variant="secondary">Populair</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Geavanceerde AI voor complexe schema optimalisatie en natuurlijke taal verwerking
              </p>
            </div>

            {/* Abacus.ai */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedProvider === 'abacus' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedProvider('abacus')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5" />
                <h4 className="font-medium">Abacus.ai</h4>
                <Badge variant="outline">Specialist</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Gespecialiseerd in planning en schema optimalisatie met machine learning
              </p>
            </div>
          </div>

          {!selectedProvider && (
            <div className="mt-4 p-3 border border-orange-200 bg-orange-50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <p className="text-sm text-orange-800">
                Selecteer een AI service om het schema te kunnen genereren
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generatie actie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schema Genereren</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={handleGenerate}
              disabled={!selectedProvider || !isValid || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Genereren met {selectedProvider?.toUpperCase()}...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Genereer Schema met {selectedProvider?.toUpperCase() || 'AI'}
                </>
              )}
            </Button>

            {isGenerating && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Dit kan 30-60 seconden duren...</p>
                <p>De AI analyseert alle voorkeuren en constraints</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={isGenerating}>
          Vorige: Format
        </Button>
        <Button onClick={onNext} disabled={!generatedSchedule}>
          Volgende: Voorvertoning
        </Button>
      </div>
    </div>
  );
};

export default AIGenerationCombinedTab;
