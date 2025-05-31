
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const [activeStep, setActiveStep] = useState("format");
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

  // Add function to select all teams
  const selectAllTeams = () => {
    if (teams) {
      setSelectedTeams(teams.map(team => team.team_id));
    }
  };

  // Add function to deselect all teams
  const deselectAllTeams = () => {
    setSelectedTeams([]);
  };

  const showPreview = selectedFormat &&
    selectedVenues.length > 0 &&
    selectedHolidays.length > 0 &&
    selectedTeams.length > 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Competitiebeheer</CardTitle>
          <CardDescription>
            Genereer een nieuwe competitie in 5 stappen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeStep} onValueChange={setActiveStep} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="format">1. Format</TabsTrigger>
              <TabsTrigger value="venues">2. Locaties</TabsTrigger>
              <TabsTrigger value="holidays">3. Uitzonderingen</TabsTrigger>
              <TabsTrigger value="teams">4. Teams</TabsTrigger>
              <TabsTrigger value="generate">5. Genereren</TabsTrigger>
            </TabsList>

            {/* Step 1: Select Competition Format */}
            <TabsContent value="format" className="space-y-4">
              <div className="grid gap-4">
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
              </div>
              <Button onClick={() => setActiveStep("venues")} disabled={!selectedFormat}>
                Volgende
              </Button>
            </TabsContent>

            {/* Step 2: Select Venues */}
            <TabsContent value="venues" className="space-y-4">
              <div className="grid gap-4">
                <h3 className="text-lg font-medium">Selecteer de locaties</h3>
                {loadingVenues ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {venue.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between">
                <Button variant="outline" onClick={() => setActiveStep("format")}>
                  Vorige
                </Button>
                <Button onClick={() => setActiveStep("holidays")}>
                  Volgende
                </Button>
              </div>
            </TabsContent>

            {/* Step 3: Select Holidays */}
            <TabsContent value="holidays" className="space-y-4">
              <div className="grid gap-4">
                <h3 className="text-lg font-medium">Selecteer de uitzonderingen</h3>
                {loadingHolidays ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Label htmlFor={`holiday-${holiday.holiday_id}`} className="flex-1 cursor-pointer">
                          {holiday.name} ({new Date(holiday.start_date).toLocaleDateString('nl-NL')} - {new Date(holiday.end_date).toLocaleDateString('nl-NL')})
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between">
                <Button variant="outline" onClick={() => setActiveStep("venues")}>
                  Vorige
                </Button>
                <Button onClick={() => setActiveStep("teams")}>
                  Volgende
                </Button>
              </div>
            </TabsContent>

            {/* Step 4: Select Teams */}
            <TabsContent value="teams" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Selecteer de deelnemende teams</h3>
                <div className="space-x-2">
                  <Button variant="outline" onClick={selectAllTeams} size="sm">
                    Selecteer alle teams
                  </Button>
                  <Button variant="outline" onClick={deselectAllTeams} size="sm">
                    Deselecteer alle teams
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
              
              <div className="mt-4 pt-4 border-t flex justify-between">
                <Button variant="outline" onClick={() => setActiveStep("holidays")}>
                  Vorige
                </Button>
                <Button 
                  onClick={() => setActiveStep("generate")}
                  disabled={selectedTeams.length < 2}
                >
                  Volgende
                </Button>
              </div>
            </TabsContent>

            {/* Step 5: Generate Schedule */}
            <TabsContent value="generate" className="space-y-4">
              <div className="grid gap-4">
                <h3 className="text-lg font-medium">Genereer het schema</h3>
                <div className="space-y-2">
                  <Label htmlFor="dates">Beschikbare data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
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
                    <PopoverContent className="w-auto p-0" align="center" side="bottom">
                      <div className="border rounded-md p-2">
                        <p className="text-xs text-muted-foreground px-2 mb-1">
                          Selecteer de data waarop wedstrijden gespeeld kunnen worden
                        </p>
                        <div className="border-b mb-2" />
                        <React.Suspense fallback={<p>Loading...</p>}>
                          <Calendar
                            mode="range"
                            defaultMonth={availableDates?.from}
                            selected={availableDates}
                            onSelect={generateAvailableDates}
                            numberOfMonths={2}
                            pagedNavigation
                            className="border-none shadow-none"
                          />
                        </React.Suspense>
                        <div className="flex justify-end mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => generateAvailableDates(undefined)}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {availableDates?.from && availableDates?.to && (
                  <div className="rounded-md border p-4">
                    <p className="text-sm font-medium">
                      Geselecteerde data: {format(availableDates.from, "dd/MM/yyyy")} - {format(availableDates.to, "dd/MM/yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mogelijke speeldagen:
                    </p>
                    <ul className="list-disc pl-5">
                      {Array.from({ length: Math.ceil((availableDates.to.getTime() - availableDates.from.getTime()) / (1000 * 60 * 60 * 24)) + 1 }, (_, i) => {
                        const date = addDays(availableDates.from!, i);
                        return (
                          <li key={i}>
                            {formatDayOfWeek(date)} ({date.toLocaleDateString('nl-NL')})
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between">
                <Button variant="outline" onClick={() => setActiveStep("teams")}>
                  Vorige
                </Button>
                <Button onClick={() => setActiveStep("generate")} disabled={!availableDates?.from || !availableDates?.to}>
                  Genereer
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitionManagementTab;
