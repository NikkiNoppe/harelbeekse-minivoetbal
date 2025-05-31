
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Loader2, Users, MapPin, CalendarDays, Eye } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
}

interface CompetitionFormat {
  format_id: number;
  name: string;
  description: string;
  has_playoffs: boolean;
  regular_rounds: number;
}

const CompetitionManagementTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState("setup");
  const [selectedFormat, setSelectedFormat] = useState<number | null>(null);
  const [competitionName, setCompetitionName] = useState("");
  const [selectedVenues, setSelectedVenues] = useState<number[]>([]);
  const [selectedHolidays, setSelectedHolidays] = useState<number[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<DateRange | undefined>(undefined);
  const [cupCompetition, setCupCompetition] = useState(false);

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

  const generateAvailableDates = (dateRange: DateRange | undefined) => {
    setAvailableDates(dateRange);
  };

  const formatDayOfWeek = (date: Date): string => {
    return date.toLocaleDateString('nl-NL', { weekday: 'long' });
  };

  const handleCupCompetitionChange = (checked: boolean | "indeterminate") => {
    if (typeof checked === "boolean") {
      setCupCompetition(checked);
    }
  };

  const selectAllTeams = () => {
    if (teams) {
      setSelectedTeams(teams.map(team => team.team_id));
    }
  };

  const deselectAllTeams = () => {
    setSelectedTeams([]);
  };

  const generateSchedule = () => {
    // Mock schedule generation - replace with actual logic
    const mockSchedule = [
      {
        id: 1,
        match_date: new Date(),
        home_team: "Team A",
        away_team: "Team B",
        venue: "Locatie 1"
      },
      {
        id: 2,
        match_date: new Date(),
        home_team: "Team C",
        away_team: "Team D",
        venue: "Locatie 2"
      }
    ];
    setGeneratedSchedule(mockSchedule);
    setActiveTab("preview");
  };

  const canGenerate = selectedFormat && 
    selectedVenues.length > 0 && 
    selectedTeams.length > 1 && 
    availableDates?.from && 
    availableDates?.to &&
    competitionName.trim() !== "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Competitiebeheer</CardTitle>
          <CardDescription>
            Genereer een nieuwe competitie met alle instellingen in één overzicht
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="setup" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Configuratie
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Voorvertoning
              </TabsTrigger>
            </TabsList>

            {/* Setup Tab - All configuration in one place */}
            <TabsContent value="setup" className="space-y-6">
              {/* Competition Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Competitie Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Naam van de competitie</Label>
                      <Input
                        id="name"
                        placeholder="Naam"
                        value={competitionName}
                        onChange={(e) => setCompetitionName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="format">Selecteer een format</Label>
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
                  
                  {selectedFormat && (
                    <div className="rounded-md border p-4">
                      <p className="text-sm font-medium">
                        {competitionFormats?.find(format => format.format_id === selectedFormat)?.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="cup-competition" 
                      checked={cupCompetition}
                      onCheckedChange={handleCupCompetitionChange} 
                    />
                    <Label htmlFor="cup-competition">Beker competitie</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Date Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Beschikbare Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dates">Selecteer datumbereik</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[280px] justify-start text-left font-normal",
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
                            <span>Kies een datum</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          defaultMonth={availableDates?.from}
                          selected={availableDates}
                          onSelect={generateAvailableDates}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              {/* Venue Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Locaties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingVenues ? (
                    <div className="flex items-center justify-center h-20">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          <Label htmlFor={`venue-${venue.venue_id}`} className="flex-1 cursor-pointer text-sm">
                            {venue.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Holiday Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Uitzonderingen (Vakanties)</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingHolidays ? (
                    <div className="flex items-center justify-center h-20">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {holidays?.map((holiday) => (
                        <div key={holiday.holiday_id} className="flex items-center space-x-2 border p-3 rounded-md">
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
                </CardContent>
              </Card>

              {/* Team Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Deelnemende Teams
                    </span>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={selectAllTeams} size="sm">
                        Selecteer alle teams
                      </Button>
                      <Button variant="outline" onClick={deselectAllTeams} size="sm">
                        Deselecteer alle teams
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingTeams ? (
                    <div className="flex items-center justify-center h-20">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          <Label htmlFor={`team-${team.team_id}`} className="flex-1 cursor-pointer text-sm">
                            {team.team_name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  onClick={generateSchedule}
                  disabled={!canGenerate}
                  className="px-8"
                >
                  Genereer Schema
                </Button>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Schema Voorvertoning</CardTitle>
                  <CardDescription>
                    Overzicht van de gegenereerde wedstrijden
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedSchedule.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-blue-900">Competitie</h3>
                          <p className="text-blue-700">{competitionName}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-green-900">Teams</h3>
                          <p className="text-green-700">{selectedTeams.length} teams</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-purple-900">Wedstrijden</h3>
                          <p className="text-purple-700">{generatedSchedule.length} wedstrijden</p>
                        </div>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Datum</TableHead>
                            <TableHead>Thuis</TableHead>
                            <TableHead>Uit</TableHead>
                            <TableHead>Locatie</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {generatedSchedule.map((match) => (
                            <TableRow key={match.id}>
                              <TableCell>{match.match_date.toLocaleDateString('nl-NL')}</TableCell>
                              <TableCell>{match.home_team}</TableCell>
                              <TableCell>{match.away_team}</TableCell>
                              <TableCell>{match.venue}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setActiveTab("setup")}>
                          Terug naar Configuratie
                        </Button>
                        <div className="space-x-2">
                          <Button variant="outline" onClick={generateSchedule}>
                            Opnieuw Genereren
                          </Button>
                          <Button>
                            Schema Opslaan
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Geen schema gegenereerd. Ga terug naar Configuratie om een schema te genereren.</p>
                      <Button variant="outline" onClick={() => setActiveTab("setup")} className="mt-4">
                        Naar Configuratie
                      </Button>
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
