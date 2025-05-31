
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Loader2, Users, Trophy, Calendar, Eye } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Venue {
  venue_id: number;
  name: string;
  address: string;
}

interface Holiday {
  holiday_id: number;
  name: string;
  start_date: string;
  end_date: string;
}

interface Team {
  team_id: number;
  team_name: string;
  balance: number;
}

interface CompetitionFormat {
  format_id: number;
  name: string;
  description: string;
  has_playoffs: boolean;
  regular_rounds: number;
}

interface GeneratedMatch {
  matchday: string;
  date: string;
  time: string;
  home_team: string;
  away_team: string;
  venue: string;
  field_cost: number;
  referee_cost: number;
}

const CompetitionManagementTab: React.FC = () => {
  const [activeStep, setActiveStep] = useState("setup");
  const [competitionName, setCompetitionName] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<number | null>(null);
  const [selectedVenues, setSelectedVenues] = useState<number[]>([]);
  const [selectedHolidays, setSelectedHolidays] = useState<number[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [availableDates, setAvailableDates] = useState<DateRange | undefined>(undefined);
  const [cupCompetition, setCupCompetition] = useState(false);
  const [generatedMatches, setGeneratedMatches] = useState<GeneratedMatch[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data queries
  const { data: venues, isLoading: loadingVenues } = useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('venue_id, name, address')
        .order('name');
      if (error) throw error;
      return data as Venue[];
    }
  });

  const { data: holidays, isLoading: loadingHolidays } = useQuery({
    queryKey: ['holiday_periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holiday_periods')
        .select('holiday_id, name, start_date, end_date')
        .order('start_date');
      if (error) throw error;
      return data as Holiday[];
    }
  });

  const { data: teams, isLoading: loadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('team_name');
      if (error) throw error;
      return data as Team[];
    }
  });

  const { data: competitionFormats, isLoading: loadingFormats } = useQuery({
    queryKey: ['competition-formats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_formats')
        .select('*');
      if (error) throw error;
      return data as CompetitionFormat[];
    }
  });

  // Save competition mutation
  const saveCompetitionMutation = useMutation({
    mutationFn: async () => {
      if (!competitionName || !selectedFormat || !availableDates?.from || !availableDates?.to) {
        throw new Error('Ontbrekende gegevens');
      }

      // Save competition
      const { data: competition, error: compError } = await supabase
        .from('competitions')
        .insert({
          name: competitionName,
          start_date: availableDates.from.toISOString().split('T')[0],
          end_date: availableDates.to.toISOString().split('T')[0],
          is_playoff: cupCompetition
        })
        .select()
        .single();

      if (compError) throw compError;

      // Generate and save matchdays
      const matchdays = [...new Set(generatedMatches.map(m => m.matchday))];
      const matchdayInserts = matchdays.map(matchday => ({
        name: matchday,
        matchday_date: generatedMatches.find(m => m.matchday === matchday)?.date || '',
        competition_id: competition.competition_id,
        is_playoff: cupCompetition
      }));

      const { data: savedMatchdays, error: matchdayError } = await supabase
        .from('matchdays')
        .insert(matchdayInserts)
        .select();

      if (matchdayError) throw matchdayError;

      // Save matches
      const matchInserts = generatedMatches.map(match => {
        const matchday = savedMatchdays.find(md => md.name === match.matchday);
        const homeTeam = teams?.find(t => t.team_name === match.home_team);
        const awayTeam = teams?.find(t => t.team_name === match.away_team);
        
        return {
          home_team_id: homeTeam?.team_id,
          away_team_id: awayTeam?.team_id,
          match_date: `${match.date} ${match.time}`,
          matchday_id: matchday?.matchday_id,
          field_cost: match.field_cost,
          referee_cost: match.referee_cost,
          is_cup_match: cupCompetition
        };
      });

      const { error: matchError } = await supabase
        .from('matches')
        .insert(matchInserts);

      if (matchError) throw matchError;

      return competition;
    },
    onSuccess: () => {
      toast({
        title: "Competitie opgeslagen",
        description: "De competitie en wedstrijden zijn succesvol aangemaakt."
      });
      // Reset form
      setCompetitionName("");
      setSelectedFormat(null);
      setSelectedVenues([]);
      setSelectedHolidays([]);
      setSelectedTeams([]);
      setAvailableDates(undefined);
      setCupCompetition(false);
      setGeneratedMatches([]);
      setActiveStep("setup");
    },
    onError: (error) => {
      toast({
        title: "Fout bij opslaan",
        description: `Kon competitie niet opslaan: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const generateSchedule = () => {
    if (selectedTeams.length < 2 || !availableDates?.from || !availableDates?.to) {
      toast({
        title: "Ontbrekende gegevens",
        description: "Selecteer minimaal 2 teams en beschikbare data.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Simple schedule generation logic
    const selectedTeamData = teams?.filter(t => selectedTeams.includes(t.team_id)) || [];
    const selectedVenueData = venues?.filter(v => selectedVenues.includes(v.venue_id)) || [];
    
    const matches: GeneratedMatch[] = [];
    let matchdayCount = 1;
    
    // Generate round-robin matches
    for (let i = 0; i < selectedTeamData.length; i++) {
      for (let j = i + 1; j < selectedTeamData.length; j++) {
        const homeTeam = selectedTeamData[i];
        const awayTeam = selectedTeamData[j];
        const venue = selectedVenueData[matches.length % selectedVenueData.length];
        
        const matchDate = addDays(availableDates.from, Math.floor(matches.length / 3) * 7);
        
        matches.push({
          matchday: `Speeldag ${matchdayCount}`,
          date: matchDate.toISOString().split('T')[0],
          time: "20:00",
          home_team: homeTeam.team_name,
          away_team: awayTeam.team_name,
          venue: venue?.name || "Onbekend",
          field_cost: 5,
          referee_cost: 6
        });
        
        if (matches.length % 3 === 0) {
          matchdayCount++;
        }
      }
    }
    
    setGeneratedMatches(matches);
    setIsGenerating(false);
    setActiveStep("preview");
  };

  const selectAllTeams = () => {
    if (teams) {
      setSelectedTeams(teams.map(team => team.team_id));
    }
  };

  const deselectAllTeams = () => {
    setSelectedTeams([]);
  };

  const canGenerate = selectedFormat && 
    selectedVenues.length > 0 && 
    selectedTeams.length >= 2 && 
    availableDates?.from && 
    availableDates?.to &&
    competitionName.trim() !== "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Competitiebeheer</CardTitle>
          <CardDescription>
            Genereer een nieuwe competitie in een geïntegreerd proces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeStep} onValueChange={setActiveStep} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="setup" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Setup
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2" disabled={generatedMatches.length === 0}>
                <Eye className="h-4 w-4" />
                Voorvertoning
              </TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-6">
              {/* Competition Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Competitie Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Naam van de competitie</Label>
                      <Input
                        id="name"
                        placeholder="Competitie naam"
                        value={competitionName}
                        onChange={(e) => setCompetitionName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="format">Competitie Format</Label>
                      <Select onValueChange={(value) => setSelectedFormat(parseInt(value))}>
                        <SelectTrigger id="format">
                          <SelectValue placeholder="Selecteer een format" />
                        </SelectTrigger>
                        <SelectContent>
                          {competitionFormats?.map((format) => (
                            <SelectItem key={format.format_id} value={format.format_id.toString()}>
                              {format.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="cup-competition" 
                      checked={cupCompetition}
                      onCheckedChange={(checked) => setCupCompetition(!!checked)} 
                    />
                    <Label htmlFor="cup-competition">Beker competitie</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Teams Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Selectie
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={selectAllTeams} size="sm">
                      Selecteer alle teams
                    </Button>
                    <Button variant="outline" onClick={deselectAllTeams} size="sm">
                      Deselecteer alle teams
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingTeams ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teams?.map((team) => (
                        <div key={team.team_id} className="flex items-center space-x-2 border p-3 rounded-md">
                          <Checkbox
                            id={`team-${team.team_id}`}
                            checked={selectedTeams.includes(team.team_id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTeams([...selectedTeams, team.team_id]);
                              } else {
                                setSelectedTeams(selectedTeams.filter(id => id !== team.team_id));
                              }
                            }}
                          />
                          <Label htmlFor={`team-${team.team_id}`} className="flex-1 cursor-pointer">
                            {team.team_name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Venues and Dates */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Venues */}
                <Card>
                  <CardHeader>
                    <CardTitle>Locaties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingVenues ? (
                      <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {venues?.map((venue) => (
                          <div key={venue.venue_id} className="flex items-center space-x-2 border p-3 rounded-md">
                            <Checkbox
                              id={`venue-${venue.venue_id}`}
                              checked={selectedVenues.includes(venue.venue_id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVenues([...selectedVenues, venue.venue_id]);
                                } else {
                                  setSelectedVenues(selectedVenues.filter(id => id !== venue.venue_id));
                                }
                              }}
                            />
                            <Label htmlFor={`venue-${venue.venue_id}`} className="flex-1 cursor-pointer">
                              <div>
                                <div className="font-medium">{venue.name}</div>
                                <div className="text-sm text-muted-foreground">{venue.address}</div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Available Dates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Beschikbare Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Selecteer datum bereik</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !availableDates && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {availableDates?.from ? (
                              availableDates.to ? (
                                `${format(availableDates.from, "dd/MM/yyyy")} - ${format(availableDates.to, "dd/MM/yyyy")}`
                              ) : (
                                format(availableDates.from, "dd/MM/yyyy")
                              )
                            ) : (
                              <span>Kies datum bereik</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <CalendarComponent
                            mode="range"
                            defaultMonth={availableDates?.from}
                            selected={availableDates}
                            onSelect={setAvailableDates}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Holiday Periods */}
                    <div className="space-y-2">
                      <Label>Uitsluitingen (Vakanties)</Label>
                      {loadingHolidays ? (
                        <div className="flex items-center justify-center h-20">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {holidays?.map((holiday) => (
                            <div key={holiday.holiday_id} className="flex items-center space-x-2 border p-2 rounded-md">
                              <Checkbox
                                id={`holiday-${holiday.holiday_id}`}
                                checked={selectedHolidays.includes(holiday.holiday_id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedHolidays([...selectedHolidays, holiday.holiday_id]);
                                  } else {
                                    setSelectedHolidays(selectedHolidays.filter(id => id !== holiday.holiday_id));
                                  }
                                }}
                              />
                              <Label htmlFor={`holiday-${holiday.holiday_id}`} className="flex-1 cursor-pointer text-sm">
                                {holiday.name} ({new Date(holiday.start_date).toLocaleDateString('nl-NL')} - {new Date(holiday.end_date).toLocaleDateString('nl-NL')})
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={generateSchedule} 
                  disabled={!canGenerate || isGenerating}
                  size="lg"
                  className="w-full md:w-auto"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Schema genereren...
                    </>
                  ) : (
                    "Genereer Schema"
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Schema Voorvertoning</CardTitle>
                  <CardDescription>
                    Controleer het gegenereerde schema voordat u het opslaat
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedMatches.length > 0 ? (
                    <>
                      {/* Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-primary">{generatedMatches.length}</div>
                          <div className="text-sm text-muted-foreground">Totaal Wedstrijden</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-primary">{selectedTeams.length}</div>
                          <div className="text-sm text-muted-foreground">Teams</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-primary">{[...new Set(generatedMatches.map(m => m.matchday))].length}</div>
                          <div className="text-sm text-muted-foreground">Speeldagen</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-primary">€{(generatedMatches.length * 11).toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">Totale Kosten</div>
                        </div>
                      </div>

                      {/* Matches Table */}
                      <div className="rounded-md border max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Speeldag</TableHead>
                              <TableHead>Datum</TableHead>
                              <TableHead>Tijd</TableHead>
                              <TableHead>Wedstrijd</TableHead>
                              <TableHead>Locatie</TableHead>
                              <TableHead>Kosten</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {generatedMatches.map((match, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Badge variant="outline">{match.matchday}</Badge>
                                </TableCell>
                                <TableCell>{match.date}</TableCell>
                                <TableCell>{match.time}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{match.home_team}</span>
                                    <span className="text-muted-foreground">vs</span>
                                    <span className="font-medium">{match.away_team}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{match.venue}</TableCell>
                                <TableCell>€{(match.field_cost + match.referee_cost).toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveStep("setup")}
                        >
                          Terug naar Setup
                        </Button>
                        <div className="space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={generateSchedule}
                            disabled={isGenerating}
                          >
                            Opnieuw Genereren
                          </Button>
                          <Button 
                            onClick={() => saveCompetitionMutation.mutate()}
                            disabled={saveCompetitionMutation.isPending}
                          >
                            {saveCompetitionMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Opslaan...
                              </>
                            ) : (
                              "Competitie Opslaan"
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Genereer eerst een schema in de Setup tab
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitionManagementTab;
