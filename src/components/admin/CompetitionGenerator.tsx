
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Calendar, Check } from "lucide-react";

interface AvailableDate {
  date_id: number;
  available_date: string;
  is_cup_date: boolean;
  is_available: boolean;
}

interface CompetitionFormat {
  format_id: number;
  name: string;
  description: string | null;
  has_playoffs: boolean;
  regular_rounds: number;
}

interface Team {
  team_id: number;
  team_name: string;
}

interface GeneratedMatch {
  home_team_id: number;
  away_team_id: number;
  matchday: number;
  home_team_name: string;
  away_team_name: string;
}

const CompetitionGenerator: React.FC = () => {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<number | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [generatedMatches, setGeneratedMatches] = useState<GeneratedMatch[]>([]);
  const [competitionName, setCompetitionName] = useState("Competitie 2025-2026");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch available dates from the database
  const { data: availableDates, isLoading: loadingDates } = useQuery({
    queryKey: ['availableDates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('available_dates')
        .select('*')
        .order('available_date');
      
      if (error) throw error;
      return data as AvailableDate[];
    }
  });

  // Fetch competition formats from the database
  const { data: competitionFormats, isLoading: loadingFormats } = useQuery({
    queryKey: ['competitionFormats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_formats')
        .select('*');
      
      if (error) throw error;
      return data as CompetitionFormat[];
    }
  });

  // Fetch teams from the database
  const { data: teams, isLoading: loadingTeams } = useQuery({
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

  // Genereer een competitieschema (round-robin)
  const generateSchedule = () => {
    if (!teams || teams.length < 2 || selectedTeams.length < 2) {
      toast({
        title: "Niet genoeg teams geselecteerd",
        description: "Selecteer ten minste 2 teams om een schema te genereren",
        variant: "destructive"
      });
      return;
    }

    const format = competitionFormats?.find(f => f.format_id === selectedFormat);
    if (!format) {
      toast({
        title: "Geen competitieformat geselecteerd",
        description: "Selecteer een competitieformat om door te gaan",
        variant: "destructive"
      });
      return;
    }

    const filteredTeams = teams.filter(team => selectedTeams.includes(team.team_id));
    
    // Round robin schema genereren
    const generatedMatches: GeneratedMatch[] = [];
    
    // Voor een even aantal teams
    let teamsForSchedule = [...filteredTeams];
    
    // Als we een oneven aantal teams hebben, voeg een dummy team toe
    if (teamsForSchedule.length % 2 !== 0) {
      teamsForSchedule.push({ team_id: -1, team_name: "Rust" });
    }
    
    const n = teamsForSchedule.length;
    const totalRounds = n - 1;
    
    // De eerste helft van de teams blijft op hun plaats
    const teamHome = teamsForSchedule.slice(0, n/2);
    // De tweede helft van de teams roteert tegenklokgewijs
    const teamAway = teamsForSchedule.slice(n/2);
    
    // Voor elke speeldag (n-1 speeldagen voor een volledige competitie)
    for (let round = 0; round < totalRounds; round++) {
      // Wedstrijden genereren voor deze speeldag
      for (let i = 0; i < n/2; i++) {
        // Sla wedstrijden over waar het dummy team bij betrokken is
        if (teamHome[i].team_id !== -1 && teamAway[i].team_id !== -1) {
          generatedMatches.push({
            matchday: round + 1,
            home_team_id: teamHome[i].team_id,
            away_team_id: teamAway[i].team_id,
            home_team_name: teamHome[i].team_name,
            away_team_name: teamAway[i].team_name
          });
        }
      }
      
      // Roteer de teams (eerste blijft op zijn plaats)
      const lastHomeTeam = teamHome[teamHome.length - 1];
      const firstAwayTeam = teamAway[0];
      
      // Rotatie uitvoeren
      for (let i = teamHome.length - 1; i > 0; i--) {
        teamHome[i] = teamHome[i - 1];
      }
      
      for (let i = 0; i < teamAway.length - 1; i++) {
        teamAway[i] = teamAway[i + 1];
      }
      
      teamHome[1] = firstAwayTeam;
      teamAway[teamAway.length - 1] = lastHomeTeam;
    }
    
    // Als het format dubbele wedstrijden heeft, voeg de omgekeerde wedstrijden toe
    if (format.regular_rounds === 2) {
      const secondHalfMatches = generatedMatches.map(match => ({
        matchday: match.matchday + totalRounds,
        home_team_id: match.away_team_id,
        away_team_id: match.home_team_id,
        home_team_name: match.away_team_name,
        away_team_name: match.home_team_name
      }));
      
      generatedMatches.push(...secondHalfMatches);
    }
    
    setGeneratedMatches(generatedMatches);
    
    toast({
      title: "Competitieschema gegenereerd",
      description: `${generatedMatches.length} wedstrijden zijn gegenereerd voor ${filteredTeams.length} teams`,
    });
  };

  // Sla de competitie op in de database
  const saveCompetition = async () => {
    if (generatedMatches.length === 0) {
      toast({
        title: "Geen wedstrijden om op te slaan",
        description: "Genereer eerst een competitieschema",
        variant: "destructive"
      });
      return;
    }

    if (selectedDates.length < Math.ceil(generatedMatches.length / 3)) { // Aanname: max 3 wedstrijden per speeldag
      toast({
        title: "Niet genoeg speeldagen geselecteerd",
        description: "Selecteer meer speeldagen om alle wedstrijden in te plannen",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);

    try {
      // 1. Maak eerst een nieuwe competitie aan
      const selectedDatesObjects = availableDates?.filter(d => selectedDates.includes(d.date_id)) || [];
      const startDate = selectedDatesObjects.length > 0 ? selectedDatesObjects[0].available_date : new Date().toISOString().split('T')[0];
      const endDate = selectedDatesObjects.length > 0 ? 
        selectedDatesObjects[selectedDatesObjects.length - 1].available_date : 
        new Date().toISOString().split('T')[0];
      
      const { data: compData, error: compError } = await supabase
        .from('competitions')
        .insert([
          { 
            name: competitionName, 
            start_date: startDate, 
            end_date: endDate, 
            is_playoff: false 
          }
        ])
        .select();
      
      if (compError) throw compError;
      
      const competitionId = compData[0].competition_id;

      // 2. Maak matchdays aan voor elke geselecteerde datum
      const matchdaysToCreate = selectedDatesObjects.map((date, index) => ({
        competition_id: competitionId,
        name: `Speeldag ${index + 1}`,
        matchday_date: date.available_date,
        is_playoff: false
      }));

      const { data: matchdayData, error: matchdayError } = await supabase
        .from('matchdays')
        .insert(matchdaysToCreate)
        .select();
        
      if (matchdayError) throw matchdayError;
      
      // 3. Wijs wedstrijden toe aan matchdays
      const matchDays = matchdayData || [];
      const matchesToCreate = generatedMatches.map((match, index) => {
        const matchdayIndex = Math.floor(index / 3) % matchDays.length; // Maximaal 3 wedstrijden per speeldag
        return {
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          match_date: matchDays[matchdayIndex].matchday_date,
          matchday_id: matchDays[matchdayIndex].matchday_id,
          referee_cost: 25.00,  // Default waarden
          field_cost: 50.00,    // Default waarden
        };
      });
      
      const { error: matchesError } = await supabase
        .from('matches')
        .insert(matchesToCreate);
        
      if (matchesError) throw matchesError;

      toast({
        title: "Competitie aangemaakt",
        description: `De competitie '${competitionName}' is succesvol aangemaakt met ${generatedMatches.length} wedstrijden`,
      });
      
      // Reset form
      setGeneratedMatches([]);
      setSelectedDates([]);
      setSelectedFormat(null);
      
    } catch (error: any) {
      console.error("Error creating competition:", error);
      toast({
        title: "Fout bij aanmaken competitie",
        description: error.message || "Er is een fout opgetreden bij het aanmaken van de competitie",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle een datum in de geselecteerde datums
  const toggleDate = (dateId: number) => {
    setSelectedDates(prev => 
      prev.includes(dateId) 
        ? prev.filter(id => id !== dateId) 
        : [...prev, dateId]
    );
  };

  // Toggle een team in de geselecteerde teams
  const toggleTeam = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId) 
        : [...prev, teamId]
    );
  };

  // Selecteer alle teams
  const selectAllTeams = () => {
    if (teams) {
      setSelectedTeams(teams.map(team => team.team_id));
    }
  };

  // Deselecteer alle teams
  const deselectAllTeams = () => {
    setSelectedTeams([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Competitiegenerator</CardTitle>
          <CardDescription>
            Genereer een nieuwe competitie met playoff systeem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="teams" className="space-y-6">
            <TabsList>
              <TabsTrigger value="teams">1. Teams</TabsTrigger>
              <TabsTrigger value="format">2. Format</TabsTrigger>
              <TabsTrigger value="dates">3. Speeldagen</TabsTrigger>
              <TabsTrigger value="preview">4. Voorvertoning</TabsTrigger>
            </TabsList>
            
            {/* Tab 1: Teams selecteren */}
            <TabsContent value="teams" className="space-y-4">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-medium">Selecteer de deelnemende teams</h3>
                <div className="space-x-2">
                  <Button variant="outline" onClick={selectAllTeams} size="sm">
                    Alles selecteren
                  </Button>
                  <Button variant="outline" onClick={deselectAllTeams} size="sm">
                    Alles deselecteren
                  </Button>
                </div>
              </div>
              
              {loadingTeams ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams?.map((team) => (
                    <div key={team.team_id} className="flex items-center space-x-2 border p-3 rounded-md">
                      <Checkbox
                        id={`team-${team.team_id}`}
                        checked={selectedTeams.includes(team.team_id)}
                        onCheckedChange={() => toggleTeam(team.team_id)}
                      />
                      <Label htmlFor={`team-${team.team_id}`} className="flex-1 cursor-pointer">{team.team_name}</Label>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button variant="default">
                  Volgende
                </Button>
              </div>
            </TabsContent>
            
            {/* Tab 2: Format selecteren */}
            <TabsContent value="format" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Selecteer een competitieformat</h3>
                
                {loadingFormats ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4">
                      {competitionFormats?.map((format) => (
                        <div key={format.format_id} className={`border p-4 rounded-md cursor-pointer ${
                          selectedFormat === format.format_id ? 'border-primary bg-primary/5' : ''
                        }`} onClick={() => setSelectedFormat(format.format_id)}>
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{format.name}</h4>
                              <p className="text-sm text-muted-foreground">{format.description}</p>
                            </div>
                            {selectedFormat === format.format_id && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                              {format.regular_rounds === 1 ? 'Enkele competitie' : 'Dubbele competitie'}
                            </span>
                            
                            {format.has_playoffs && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                                Met playoffs
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor="competition-name" className="block text-sm font-medium mb-2">Competitienaam</label>
                      <input
                        type="text"
                        id="competition-name"
                        className="w-full p-2 border rounded-md"
                        value={competitionName}
                        onChange={(e) => setCompetitionName(e.target.value)}
                      />
                    </div>
                  </>
                )}
                
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <Button variant="default">
                    Volgende
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Tab 3: Speeldagen selecteren */}
            <TabsContent value="dates" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Selecteer beschikbare speeldagen</h3>
                
                {loadingDates ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableDates?.map((date) => {
                      const isSelected = selectedDates.includes(date.date_id);
                      const formattedDate = new Date(date.available_date).toLocaleDateString('nl-NL', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      });
                      
                      return (
                        <div 
                          key={date.date_id} 
                          className={`border p-3 rounded-md flex items-center space-x-3 ${
                            isSelected ? 'border-primary bg-primary/5' : ''
                          } ${date.is_cup_date ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}
                          onClick={() => !date.is_cup_date && toggleDate(date.date_id)}
                        >
                          {!date.is_cup_date ? (
                            <Checkbox 
                              id={`date-${date.date_id}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleDate(date.date_id)}
                            />
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                              Beker
                            </span>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formattedDate}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <Button variant="default" onClick={generateSchedule}>
                    Schema Genereren
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Tab 4: Voorvertoning */}
            <TabsContent value="preview" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Voorvertoning Competitieschema</h3>
                
                {generatedMatches.length === 0 ? (
                  <div className="text-center py-8 border rounded-md">
                    <p className="text-muted-foreground">
                      Nog geen competitieschema gegenereerd. Ga naar het tabblad "Speeldagen" en klik op "Schema Genereren".
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="py-4">
                          <CardTitle className="text-lg">Competitiedetails</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <dl className="grid grid-cols-2 gap-4">
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Naam</dt>
                              <dd>{competitionName}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Teams</dt>
                              <dd>{selectedTeams.length}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Format</dt>
                              <dd>{competitionFormats?.find(f => f.format_id === selectedFormat)?.name}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Wedstrijden</dt>
                              <dd>{generatedMatches.length}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Speeldagen</dt>
                              <dd>{selectedDates.length}</dd>
                            </div>
                          </dl>
                        </CardContent>
                      </Card>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Speeldag</TableHead>
                            <TableHead>Thuisploeg</TableHead>
                            <TableHead className="text-center">vs</TableHead>
                            <TableHead>Uitploeg</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {generatedMatches.map((match, index) => (
                            <TableRow key={index}>
                              <TableCell>Speeldag {match.matchday}</TableCell>
                              <TableCell>{match.home_team_name}</TableCell>
                              <TableCell className="text-center">vs</TableCell>
                              <TableCell>{match.away_team_name}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                      <Button variant="outline" onClick={generateSchedule}>
                        Opnieuw Genereren
                      </Button>
                      <Button 
                        variant="default" 
                        onClick={saveCompetition} 
                        disabled={isCreating}
                      >
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Competitie Aanmaken
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitionGenerator;
