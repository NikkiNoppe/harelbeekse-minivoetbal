import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Team {
  team_id: number;
  team_name: string;
}

interface CompetitionFormat {
  format_id: number;
  name: string;
  description: string;
}

interface Venue {
  venue_id: number;
  name: string;
  address: string;
}

interface GeneratedMatch {
  id: number;
  home_team_id: number;
  away_team_id: number;
  matchday: string;
  home_team_name: string;
  away_team_name: string;
  match_date: string;
  venue_id: number;
}

const CompetitionManagementTab: React.FC = () => {
  const { toast } = useToast();
  
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [competitionFormats, setCompetitionFormats] = useState<CompetitionFormat[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedVenue, setSelectedVenue] = useState<string>("");
  const [competitionName, setCompetitionName] = useState<string>("");
  const [generatedMatches, setGeneratedMatches] = useState<GeneratedMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('team_name');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Fout",
        description: "Kon teams niet laden",
        variant: "destructive"
      });
    }
  };

  const fetchCompetitionFormats = async () => {
    try {
      const { data, error } = await supabase
        .from('competition_formats')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCompetitionFormats(data || []);
    } catch (error) {
      console.error('Error fetching competition formats:', error);
      toast({
        title: "Fout",
        description: "Kon competitie formaten niet laden",
        variant: "destructive"
      });
    }
  };

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: "Fout",
        description: "Kon locaties niet laden",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchCompetitionFormats();
    fetchVenues();
  }, []);

  const handleTeamToggle = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSelectAllTeams = () => {
    if (selectedTeams.length === teams.length) {
      setSelectedTeams([]);
    } else {
      setSelectedTeams(teams.map(team => team.team_id));
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDates(prev => 
      prev.some(d => d.getTime() === date.getTime())
        ? prev.filter(d => d.getTime() !== date.getTime())
        : [...prev, date]
    );
  };

  const generateMatches = () => {
    if (selectedTeams.length < 2) {
      toast({
        title: "Fout",
        description: "Selecteer minimaal 2 teams",
        variant: "destructive"
      });
      return;
    }

    if (selectedDates.length === 0) {
      toast({
        title: "Fout", 
        description: "Selecteer minimaal 1 datum",
        variant: "destructive"
      });
      return;
    }

    // Simple round-robin generation
    const matches: GeneratedMatch[] = [];
    let matchId = 1;

    selectedDates.forEach((date, dateIndex) => {
      for (let i = 0; i < selectedTeams.length; i++) {
        for (let j = i + 1; j < selectedTeams.length; j++) {
          const homeTeam = teams.find(t => t.team_id === selectedTeams[i]);
          const awayTeam = teams.find(t => t.team_id === selectedTeams[j]);
          
          if (homeTeam && awayTeam) {
            matches.push({
              id: matchId++,
              home_team_id: homeTeam.team_id,
              away_team_id: awayTeam.team_id,
              matchday: `Speeldag ${dateIndex + 1}`,
              home_team_name: homeTeam.team_name,
              away_team_name: awayTeam.team_name,
              match_date: format(date, 'yyyy-MM-dd'),
              venue_id: parseInt(selectedVenue) || 1
            });
          }
        }
      }
    });

    setGeneratedMatches(matches);
    
    toast({
      title: "Succes",
      description: `${matches.length} wedstrijden gegenereerd`,
    });
  };

  const saveCompetition = async () => {
    if (!competitionName.trim()) {
      toast({
        title: "Fout",
        description: "Voer een competitie naam in",
        variant: "destructive"
      });
      return;
    }

    if (generatedMatches.length === 0) {
      toast({
        title: "Fout",
        description: "Genereer eerst wedstrijden",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Create competition
      const { data: competition, error: competitionError } = await supabase
        .from('competitions')
        .insert({
          name: competitionName,
          start_date: selectedDates[0],
          end_date: selectedDates[selectedDates.length - 1],
          is_playoff: false
        })
        .select()
        .single();

      if (competitionError) throw competitionError;

      // Create matchdays
      const matchdays = selectedDates.map((date, index) => ({
        name: `Speeldag ${index + 1}`,
        matchday_date: date,
        competition_id: competition.competition_id,
        is_playoff: false
      }));

      const { data: createdMatchdays, error: matchdaysError } = await supabase
        .from('matchdays')
        .insert(matchdays)
        .select();

      if (matchdaysError) throw matchdaysError;

      // Create matches
      const matchesToInsert = generatedMatches.map(match => {
        const matchday = createdMatchdays?.find(md => 
          md.name === match.matchday
        );
        
        return {
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          match_date: new Date(`${match.match_date}T20:00:00`),
          matchday_id: matchday?.matchday_id,
          field_cost: 10.00,
          referee_cost: 12.00,
          is_cup_match: false
        };
      });

      const { error: matchesError } = await supabase
        .from('matches')
        .insert(matchesToInsert);

      if (matchesError) throw matchesError;

      toast({
        title: "Succes",
        description: "Competitie succesvol opgeslagen",
      });

      // Reset form
      setCompetitionName("");
      setSelectedTeams([]);
      setSelectedDates([]);
      setGeneratedMatches([]);
      
    } catch (error) {
      console.error('Error saving competition:', error);
      toast({
        title: "Fout",
        description: "Kon competitie niet opslaan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Competitie Generator</CardTitle>
          <CardDescription>
            Genereer automatisch competities en wedstrijdschema's
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="teams" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="format">Formaat</TabsTrigger>
              <TabsTrigger value="dates">Data</TabsTrigger>
              <TabsTrigger value="preview">Overzicht</TabsTrigger>
            </TabsList>
            
            <TabsContent value="teams" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Selecteer Teams</h3>
                <Button 
                  onClick={handleSelectAllTeams}
                  variant="outline"
                  size="sm"
                >
                  {selectedTeams.length === teams.length ? "Deselecteer alle" : "Selecteer alle teams"}
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {teams.map((team) => (
                  <div key={team.team_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`team-${team.team_id}`}
                      checked={selectedTeams.includes(team.team_id)}
                      onCheckedChange={() => handleTeamToggle(team.team_id)}
                    />
                    <label 
                      htmlFor={`team-${team.team_id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {team.team_name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedTeams.length} teams geselecteerd
              </p>
            </TabsContent>

            <TabsContent value="format" className="space-y-4">
              <h3 className="text-lg font-medium">Competitie Formaat</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Competitie Naam</label>
                  <input
                    type="text"
                    value={competitionName}
                    onChange={(e) => setCompetitionName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Voer competitie naam in..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Formaat</label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer formaat" />
                    </SelectTrigger>
                    <SelectContent>
                      {competitionFormats.map((format) => (
                        <SelectItem key={format.format_id} value={format.format_id.toString()}>
                          {format.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Locatie</label>
                  <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer locatie" />
                    </SelectTrigger>
                    <SelectContent>
                      {venues.map((venue) => (
                        <SelectItem key={venue.venue_id} value={venue.venue_id.toString()}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dates" className="space-y-4">
              <h3 className="text-lg font-medium">Selecteer Data</h3>
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => setSelectedDates(dates || [])}
                className="rounded-md border"
                locale={nl}
              />
              <div className="space-y-2">
                <p className="text-sm font-medium">Geselecteerde data:</p>
                {selectedDates.map((date, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">
                      {format(date, 'EEEE dd MMMM yyyy', { locale: nl })}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedDates(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Wedstrijdschema Overzicht</h3>
                <div className="space-x-2">
                  <Button onClick={generateMatches} disabled={loading}>
                    Genereer Wedstrijden
                  </Button>
                  <Button 
                    onClick={saveCompetition} 
                    disabled={loading || generatedMatches.length === 0}
                  >
                    Opslaan
                  </Button>
                </div>
              </div>
              
              {generatedMatches.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {generatedMatches.length} wedstrijden gegenereerd
                  </p>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {generatedMatches.map((match) => (
                      <div key={match.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <span className="font-medium">
                            {match.home_team_name} vs {match.away_team_name}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {match.matchday} - {format(new Date(match.match_date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitionManagementTab;
