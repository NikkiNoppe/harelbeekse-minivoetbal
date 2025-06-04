
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { CalendarIcon, Loader2, Users, MapPin, CalendarDays, Eye, Plus, Clock } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Venue {
  venue_id: number;
  name: string;
  address: string;
}

interface VenueWithTimeslots extends Venue {
  timeslots: VenueTimeslot[];
}

interface VenueTimeslot {
  timeslot_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
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

interface GeneratedMatch {
  home_team: string;
  away_team: string;
  match_date: string;
  match_time: string;
  venue: string;
  matchday: number;
}

const CompetitionManagementTab: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("setup");
  const [selectedFormat, setSelectedFormat] = useState<number | null>(null);
  const [competitionName, setCompetitionName] = useState("");
  const [selectedVenues, setSelectedVenues] = useState<number[]>([]);
  const [selectedHolidays, setSelectedHolidays] = useState<number[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedMatch[]>([]);
  const [availableDates, setAvailableDates] = useState<DateRange | undefined>(undefined);
  
  // Holiday dialog state
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayStartDate, setNewHolidayStartDate] = useState("");
  const [newHolidayEndDate, setNewHolidayEndDate] = useState("");

  // Manual schedule state
  const [manualScheduleDialogOpen, setManualScheduleDialogOpen] = useState(false);
  const [manualScheduleName, setManualScheduleName] = useState("");
  const [manualScheduleDescription, setManualScheduleDescription] = useState("");

  const { data: venuesWithTimeslots, isLoading: loadingVenues } = useQuery({
    queryKey: ['venues-with-timeslots'],
    queryFn: async () => {
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select(`
          venue_id, 
          name, 
          address,
          venue_timeslots (
            timeslot_id,
            day_of_week,
            start_time,
            end_time
          )
        `)
        .order('name');
      
      if (venuesError) throw venuesError;
      
      return venues?.map(venue => ({
        venue_id: venue.venue_id,
        name: venue.name,
        address: venue.address,
        timeslots: venue.venue_timeslots || []
      })) as VenueWithTimeslots[];
    }
  });

  const { data: holidays, isLoading: loadingHolidays, refetch: refetchHolidays } = useQuery({
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

  const handleDateSelect = (dateRange: DateRange | undefined) => {
    setAvailableDates(dateRange);
  };

  const getDayName = (dayNumber: number): string => {
    const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
    return days[dayNumber] || 'Onbekend';
  };

  const getTotalWeeklyHours = (): number => {
    if (!venuesWithTimeslots) return 0;
    
    let totalHours = 0;
    selectedVenues.forEach(venueId => {
      const venue = venuesWithTimeslots.find(v => v.venue_id === venueId);
      if (venue) {
        venue.timeslots.forEach(timeslot => {
          const start = new Date(`2000-01-01T${timeslot.start_time}`);
          const end = new Date(`2000-01-01T${timeslot.end_time}`);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          totalHours += hours;
        });
      }
    });
    return totalHours;
  };

  const addHoliday = async () => {
    if (!newHolidayName || !newHolidayStartDate || !newHolidayEndDate) {
      toast({
        title: "Fout",
        description: "Vul alle velden in voor de vakantieperiode",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('holiday_periods')
        .insert({
          name: newHolidayName,
          start_date: newHolidayStartDate,
          end_date: newHolidayEndDate
        });

      if (error) throw error;

      toast({
        title: "Vakantieperiode toegevoegd",
        description: `${newHolidayName} is succesvol toegevoegd`
      });

      setNewHolidayName("");
      setNewHolidayStartDate("");
      setNewHolidayEndDate("");
      setHolidayDialogOpen(false);
      refetchHolidays();
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de vakantieperiode",
        variant: "destructive"
      });
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
    if (!selectedFormat || selectedTeams.length < 2 || selectedVenues.length === 0) {
      toast({
        title: "Incomplete instellingen",
        description: "Selecteer een format, minimaal 2 teams en minstens 1 locatie",
        variant: "destructive"
      });
      return;
    }

    // Mock schedule generation based on settings
    const format = competitionFormats?.find(f => f.format_id === selectedFormat);
    const selectedTeamsList = teams?.filter(t => selectedTeams.includes(t.team_id)) || [];
    const selectedVenuesList = venuesWithTimeslots?.filter(v => selectedVenues.includes(v.venue_id)) || [];
    
    const mockSchedule: GeneratedMatch[] = [];
    let matchDay = 1;
    
    // Generate matches based on format
    const rounds = format?.regular_rounds || 1;
    
    for (let round = 0; round < rounds; round++) {
      for (let i = 0; i < selectedTeamsList.length; i += 2) {
        if (i + 1 < selectedTeamsList.length) {
          const venue = selectedVenuesList[Math.floor(Math.random() * selectedVenuesList.length)];
          const timeslot = venue.timeslots[Math.floor(Math.random() * venue.timeslots.length)];
          
          mockSchedule.push({
            home_team: selectedTeamsList[i].team_name,
            away_team: selectedTeamsList[i + 1].team_name,
            match_date: new Date(Date.now() + matchDay * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL'),
            match_time: timeslot ? timeslot.start_time : "19:00",
            venue: venue.name,
            matchday: Math.ceil(mockSchedule.length / Math.floor(selectedTeamsList.length / 2)) + 1
          });
        }
      }
      matchDay++;
    }
    
    setGeneratedSchedule(mockSchedule);
    setActiveTab("preview");
    
    toast({
      title: "Schema gegenereerd",
      description: `${mockSchedule.length} wedstrijden gegenereerd voor ${format?.name || 'Onbekend format'}`
    });
  };

  const createManualSchedule = async () => {
    if (!manualScheduleName.trim()) {
      toast({
        title: "Fout",
        description: "Vul een naam in voor het handmatige schema",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('manual_competition_schedules')
        .insert({
          name: manualScheduleName,
          description: manualScheduleDescription || null
        });

      if (error) throw error;

      toast({
        title: "Handmatig schema aangemaakt",
        description: `Schema "${manualScheduleName}" is succesvol aangemaakt`
      });

      setManualScheduleName("");
      setManualScheduleDescription("");
      setManualScheduleDialogOpen(false);
    } catch (error) {
      console.error('Error creating manual schedule:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het aanmaken van het handmatige schema",
        variant: "destructive"
      });
    }
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
            Genereer een nieuwe competitie met alle instellingen of maak een handmatig schema
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

            <TabsContent value="setup" className="space-y-6">
              {/* Competition Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">1. Competitie Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Naam van de competitie</Label>
                      <Input
                        id="name"
                        placeholder="Bijv. Voorjaarscompetitie 2025"
                        value={competitionName}
                        onChange={(e) => setCompetitionName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="format">Competitieformat</Label>
                      <Select onValueChange={(value) => setSelectedFormat(parseInt(value))}>
                        <SelectTrigger id="format">
                          <SelectValue placeholder="Kies een format" />
                        </SelectTrigger>
                        <SelectContent>
                          {competitionFormats?.map((format) => (
                            <SelectItem key={format.format_id} value={format.format_id.toString()}>
                              {format.name}
                              {format.has_playoffs && " (met playoffs)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {selectedFormat && (
                    <div className="rounded-md border p-4 bg-blue-50">
                      <p className="text-sm font-medium text-blue-900">
                        {competitionFormats?.find(format => format.format_id === selectedFormat)?.description}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Aantal rondes: {competitionFormats?.find(format => format.format_id === selectedFormat)?.regular_rounds}
                        {competitionFormats?.find(format => format.format_id === selectedFormat)?.has_playoffs && " + Playoffs"}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Dialog open={manualScheduleDialogOpen} onOpenChange={setManualScheduleDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Handmatig Schema Aanmaken
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Handmatig Schema Aanmaken</DialogTitle>
                          <DialogDescription>
                            Maak een leeg schema aan dat je handmatig kunt invullen
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="manual-name">Schema naam</Label>
                            <Input
                              id="manual-name"
                              placeholder="Bijv. Aangepast Schema Week 10-15"
                              value={manualScheduleName}
                              onChange={(e) => setManualScheduleName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="manual-description">Beschrijving (optioneel)</Label>
                            <Textarea
                              id="manual-description"
                              placeholder="Beschrijf het doel van dit handmatige schema"
                              value={manualScheduleDescription}
                              onChange={(e) => setManualScheduleDescription(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setManualScheduleDialogOpen(false)}>
                            Annuleren
                          </Button>
                          <Button onClick={createManualSchedule}>
                            Schema Aanmaken
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Date Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    2. Beschikbare Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dates">Selecteer datumbereik voor de competitie</Label>
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
                            <span>Kies een datumbereik</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="range"
                          defaultMonth={availableDates?.from}
                          selected={availableDates}
                          onSelect={handleDateSelect}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              {/* Venue Selection with Timeslots */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    3. Locaties & Speeltijden
                  </CardTitle>
                  <CardDescription>
                    Totaal beschikbare speeluren per week: {getTotalWeeklyHours()} uur
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingVenues ? (
                    <div className="flex items-center justify-center h-20">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {venuesWithTimeslots?.map((venue) => (
                        <div key={venue.venue_id} className="border rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
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
                            <Label htmlFor={`venue-${venue.venue_id}`} className="flex-1 cursor-pointer font-medium">
                              {venue.name}
                            </Label>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{venue.address}</p>
                          
                          {venue.timeslots.length > 0 ? (
                            <div className="ml-6 space-y-1">
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Beschikbare tijden:
                              </p>
                              {venue.timeslots.map((timeslot) => (
                                <div key={timeslot.timeslot_id} className="text-sm text-gray-600">
                                  {getDayName(timeslot.day_of_week)}: {timeslot.start_time} - {timeslot.end_time}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="ml-6 text-sm text-gray-500">
                              Geen speeltijden ingesteld
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Holiday Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    4. Uitzonderingen (Vakanties)
                    <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          Toevoegen
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Vakantieperiode Toevoegen</DialogTitle>
                          <DialogDescription>
                            Voeg een nieuwe vakantieperiode toe waarin geen wedstrijden worden ingepland
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="holiday-name">Naam vakantieperiode</Label>
                            <Input
                              id="holiday-name"
                              placeholder="Bijv. Kerstvakantie 2024"
                              value={newHolidayName}
                              onChange={(e) => setNewHolidayName(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="start-date">Startdatum</Label>
                              <Input
                                id="start-date"
                                type="date"
                                value={newHolidayStartDate}
                                onChange={(e) => setNewHolidayStartDate(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="end-date">Einddatum</Label>
                              <Input
                                id="end-date"
                                type="date"
                                value={newHolidayEndDate}
                                onChange={(e) => setNewHolidayEndDate(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setHolidayDialogOpen(false)}>
                            Annuleren
                          </Button>
                          <Button onClick={addHoliday}>
                            Toevoegen
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
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
                      5. Deelnemende Teams
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
                  <CardDescription>
                    Geselecteerd: {selectedTeams.length} teams
                  </CardDescription>
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
                  Genereer Competitieschema
                </Button>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Schema Voorvertoning</CardTitle>
                  <CardDescription>
                    Overzicht van de gegenereerde wedstrijden gebaseerd op jouw instellingen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedSchedule.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-orange-900">Locaties</h3>
                          <p className="text-orange-700">{selectedVenues.length} locaties</p>
                        </div>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Speeldag</TableHead>
                            <TableHead>Datum</TableHead>
                            <TableHead>Tijd</TableHead>
                            <TableHead>Thuis</TableHead>
                            <TableHead>Uit</TableHead>
                            <TableHead>Locatie</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {generatedSchedule.map((match, index) => (
                            <TableRow key={index}>
                              <TableCell>Speeldag {match.matchday}</TableCell>
                              <TableCell>{match.match_date}</TableCell>
                              <TableCell>{match.match_time}</TableCell>
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
                            Schema Definitief Opslaan
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
