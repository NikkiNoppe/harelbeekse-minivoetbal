
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

  // Fetch venues (locations)
  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('venue_id, name, address')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch venue timeslots
  const { data: venueTimeslots = [] } = useQuery({
    queryKey: ['venue-timeslots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_timeslots')
        .select(`
          timeslot_id,
          day_of_week,
          start_time,
          end_time,
          venues!inner(name)
        `)
        .order('day_of_week, start_time');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch vacation periods from database
  const { data: dbVacationPeriods = [] } = useQuery({
    queryKey: ['vacation-periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacation_periods')
        .select('*')
        .eq('is_active', true)
        .order('start_date');
      
      if (error) throw error;
      return data as VacationPeriod[];
    }
  });

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

  const isValid = selectedTeams.length >= 2 && config.name.trim() !== '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5" />
        <h3 className="text-lg font-semibold">AI Competitie Generator</h3>
      </div>

      {/* Format Configuratie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Format Configuratie
          </CardTitle>
          <CardDescription>
            Configureer de basis instellingen voor de competitie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="competition-name">Competitie Naam</Label>
              <Input
                id="competition-name"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="Bijv. Lente Competitie 2025"
              />
            </div>
            
            <div>
              <Label htmlFor="format-type">Format Type</Label>
              <Select 
                value={config.format_type} 
                onValueChange={(value) => setConfig({ ...config, format_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Reguliere Competitie</SelectItem>
                  <SelectItem value="playoff">Met Playoffs</SelectItem>
                  <SelectItem value="cup">Beker Systeem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Start Datum</Label>
              <Input
                id="start-date"
                type="date"
                value={config.start_date}
                onChange={(e) => setConfig({ ...config, start_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="end-date">Eind Datum</Label>
              <Input
                id="end-date"
                type="date"
                value={config.end_date}
                onChange={(e) => setConfig({ ...config, end_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="matches-per-week">Wedstrijden per week</Label>
              <Input
                id="matches-per-week"
                type="number"
                min="1"
                max="14"
                value={config.matches_per_week}
                onChange={(e) => setConfig({ ...config, matches_per_week: parseInt(e.target.value) || 7 })}
              />
            </div>

            {config.format_type === 'playoff' && (
              <div>
                <Label htmlFor="playoff-teams">Aantal playoff teams</Label>
                <Input
                  id="playoff-teams"
                  type="number"
                  min="2"
                  max="8"
                  value={config.playoff_teams || 4}
                  onChange={(e) => setConfig({ ...config, playoff_teams: parseInt(e.target.value) || 4 })}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Beschikbare locaties uit database */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Beschikbare Locaties
          </CardTitle>
          <CardDescription>
            Locaties uit de database waar wedstrijden gespeeld kunnen worden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {venues.map((venue) => (
              <div key={venue.venue_id} className="p-3 border rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <div>
                    <h4 className="font-medium">{venue.name}</h4>
                    <p className="text-sm text-muted-foreground">{venue.address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Speeldagen en tijdstippen uit database */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Beschikbare Speeltijden
          </CardTitle>
          <CardDescription>
            Tijdstippen per locatie en dag uit de database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {playDays.map((day) => {
              const daySlots = venueTimeslots.filter(slot => slot.day_of_week === day.value);
              return (
                <div key={day.value}>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {day.label}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {daySlots.map((slot) => (
                      <div key={slot.timeslot_id} className="p-2 border rounded text-center bg-muted text-sm">
                        <div className="font-medium">{slot.venues.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {slot.start_time} - {slot.end_time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Verlofperiodes uit database */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Verlofperiodes
          </CardTitle>
          <CardDescription>
            Periodes uit de database waarin geen wedstrijden gepland worden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Database vacation periods */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Beschikbare verlofperiodes</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dbVacationPeriods.map((period) => (
                <div key={period.id} className="p-3 border rounded-lg bg-muted">
                  <div className="font-medium">{period.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(period.start_date).toLocaleDateString('nl-NL')} - {new Date(period.end_date).toLocaleDateString('nl-NL')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom vacation periods */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Extra verlofperiodes</Label>
            {vacationPeriods.map((period) => (
              <div key={period.id} className="flex items-center gap-2 p-3 border rounded mb-2">
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
              Extra verlofperiode toevoegen
            </Button>
          </div>
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

            {!isValid && !isGenerating && (
              <div className="text-center text-sm text-red-600">
                <p>Vul alle verplichte velden in om te kunnen genereren</p>
              </div>
            )}

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
        <div></div>
        <Button onClick={onNext} disabled={!generatedSchedule}>
          Volgende: Voorvertoning
        </Button>
      </div>
    </div>
  );
};

export default AIGenerationCombinedTab;
