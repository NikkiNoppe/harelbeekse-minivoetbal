
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, CalendarCheck, Trash, AlertCircle, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, isBefore, isMonday, isTuesday } from "date-fns";
import { nl } from "date-fns/locale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import FormatSelectionTab from "../competition-generator/FormatSelectionTab";
import PreviewTab from "../competition-generator/PreviewTab";
import { useCompetitionGenerator } from "../competition-generator/useCompetitionGenerator";

interface Venue {
  venue_id?: number;
  name: string;
  address: string;
  timeslots: Timeslot[];
}

interface Timeslot {
  timeslot_id?: number;
  day_of_week: number; // 1=Monday, 2=Tuesday
  start_time: string;
  end_time: string;
}

interface HolidayPeriod {
  holiday_id?: number;
  name: string;
  start_date: string;
  end_date: string;
}

interface Team {
  team_id: number;
  team_name: string;
}

const CompetitionManagementTab: React.FC = () => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("2025-08-18");
  const [endDate, setEndDate] = useState("2026-07-14");
  const [isGeneratingDates, setIsGeneratingDates] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showVenueDialog, setShowVenueDialog] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [newVenue, setNewVenue] = useState<Venue>({
    name: "",
    address: "",
    timeslots: []
  });
  
  const [venues, setVenues] = useState<Venue[]>([]);
  const [holidayPeriods, setHolidayPeriods] = useState<HolidayPeriod[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [newHoliday, setNewHoliday] = useState<HolidayPeriod>({
    name: "",
    start_date: "",
    end_date: ""
  });

  const {
    competitionFormats,
    loadingFormats,
    selectedFormat,
    generatedMatches,
    competitionName,
    isCreating,
    setSelectedFormat,
    setCompetitionName,
    generateSchedule,
    saveCompetition,
    activeTab,
    setActiveTab
  } = useCompetitionGenerator();

  // Load data from Supabase
  useEffect(() => {
    loadVenues();
    loadHolidayPeriods();
    loadTeams();
  }, []);

  const loadVenues = async () => {
    try {
      const { data: venuesData, error: venuesError } = await supabase
        .from('venues')
        .select('*');
      
      if (venuesError) throw venuesError;

      const { data: timeslotsData, error: timeslotsError } = await supabase
        .from('venue_timeslots')
        .select('*');
      
      if (timeslotsError) throw timeslotsError;

      const venuesWithTimeslots = venuesData?.map(venue => ({
        ...venue,
        timeslots: timeslotsData?.filter(ts => ts.venue_id === venue.venue_id) || []
      })) || [];

      setVenues(venuesWithTimeslots);
    } catch (error: any) {
      console.error("Error loading venues:", error);
      toast({
        title: "Fout bij laden",
        description: "Kon locaties niet laden",
        variant: "destructive"
      });
    }
  };

  const loadHolidayPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('holiday_periods')
        .select('*')
        .order('start_date');
      
      if (error) throw error;
      setHolidayPeriods(data || []);
    } catch (error: any) {
      console.error("Error loading holiday periods:", error);
      toast({
        title: "Fout bij laden",
        description: "Kon vakantieperiodes niet laden",
        variant: "destructive"
      });
    }
  };

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error: any) {
      console.error("Error loading teams:", error);
      toast({
        title: "Fout bij laden",
        description: "Kon teams niet laden",
        variant: "destructive"
      });
    }
  };

  // Add a new holiday period
  const addHolidayPeriod = async () => {
    if (!newHoliday.start_date || !newHoliday.end_date || !newHoliday.name) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle velden in voor de vakantieperiode",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('holiday_periods')
        .insert([{
          name: newHoliday.name,
          start_date: newHoliday.start_date,
          end_date: newHoliday.end_date
        }]);

      if (error) throw error;

      setNewHoliday({ name: "", start_date: "", end_date: "" });
      loadHolidayPeriods();
      
      toast({
        title: "Vakantieperiode toegevoegd",
        description: `${newHoliday.name} is succesvol toegevoegd`
      });
    } catch (error: any) {
      console.error("Error adding holiday period:", error);
      toast({
        title: "Fout bij toevoegen",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Remove a holiday period
  const removeHolidayPeriod = async (holidayId: number) => {
    try {
      const { error } = await supabase
        .from('holiday_periods')
        .delete()
        .eq('holiday_id', holidayId);

      if (error) throw error;

      loadHolidayPeriods();
      toast({
        title: "Vakantieperiode verwijderd",
        description: "De vakantieperiode is succesvol verwijderd"
      });
    } catch (error: any) {
      console.error("Error removing holiday period:", error);
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Edit venue
  const editVenue = (venue: Venue) => {
    setEditingVenue(venue);
    setNewVenue({ ...venue });
    setShowVenueDialog(true);
  };

  // Add new venue
  const addNewVenue = () => {
    setEditingVenue(null);
    setNewVenue({
      name: "",
      address: "",
      timeslots: []
    });
    setShowVenueDialog(true);
  };

  // Save venue changes
  const saveVenue = async () => {
    if (!newVenue.name || !newVenue.address) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul naam en adres in voor de locatie",
        variant: "destructive"
      });
      return;
    }

    try {
      let venueId = newVenue.venue_id;

      if (editingVenue && venueId) {
        // Update existing venue
        const { error: venueError } = await supabase
          .from('venues')
          .update({
            name: newVenue.name,
            address: newVenue.address
          })
          .eq('venue_id', venueId);

        if (venueError) throw venueError;

        // Delete existing timeslots
        const { error: deleteError } = await supabase
          .from('venue_timeslots')
          .delete()
          .eq('venue_id', venueId);

        if (deleteError) throw deleteError;
      } else {
        // Create new venue
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .insert([{
            name: newVenue.name,
            address: newVenue.address
          }])
          .select()
          .single();

        if (venueError) throw venueError;
        venueId = venueData.venue_id;
      }

      // Insert timeslots
      if (newVenue.timeslots.length > 0) {
        const timeslotsToInsert = newVenue.timeslots.map(slot => ({
          venue_id: venueId,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time
        }));

        const { error: timeslotError } = await supabase
          .from('venue_timeslots')
          .insert(timeslotsToInsert);

        if (timeslotError) throw timeslotError;
      }

      setShowVenueDialog(false);
      setEditingVenue(null);
      loadVenues();

      toast({
        title: editingVenue ? "Locatie bijgewerkt" : "Locatie toegevoegd",
        description: `${newVenue.name} is succesvol ${editingVenue ? 'bijgewerkt' : 'toegevoegd'}`
      });
    } catch (error: any) {
      console.error("Error saving venue:", error);
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Remove venue
  const removeVenue = async (venueId: number) => {
    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('venue_id', venueId);

      if (error) throw error;

      loadVenues();
      toast({
        title: "Locatie verwijderd",
        description: "De locatie is succesvol verwijderd"
      });
    } catch (error: any) {
      console.error("Error removing venue:", error);
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Add timeslot to venue
  const addTimeslot = (dayOfWeek: number) => {
    setNewVenue({
      ...newVenue,
      timeslots: [...newVenue.timeslots, { 
        day_of_week: dayOfWeek, 
        start_time: '18:30', 
        end_time: '19:30' 
      }]
    });
  };

  // Remove timeslot
  const removeTimeslot = (index: number) => {
    const updatedTimeslots = [...newVenue.timeslots];
    updatedTimeslots.splice(index, 1);
    setNewVenue({ ...newVenue, timeslots: updatedTimeslots });
  };

  // Update timeslot
  const updateTimeslot = (index: number, field: keyof Timeslot, value: string | number) => {
    const updatedTimeslots = [...newVenue.timeslots];
    updatedTimeslots[index] = { ...updatedTimeslots[index], [field]: value };
    setNewVenue({ ...newVenue, timeslots: updatedTimeslots });
  };

  // Toggle team selection
  const toggleTeamSelection = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  // Check if a date falls within any holiday period
  const isHoliday = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return holidayPeriods.some(period => 
      dateStr >= period.start_date && dateStr <= period.end_date
    );
  };

  // Generate available dates
  const generateDates = async () => {
    setIsGeneratingDates(true);
    setShowConfirmDialog(true);
  };
  
  // Save generated dates to the database
  const saveDates = async () => {
    setIsGeneratingDates(true);
    setShowConfirmDialog(false);
    
    try {
      // First, delete all existing available dates
      const { error: deleteError } = await supabase
        .from('available_dates')
        .delete()
        .gte('date_id', 0);
      
      if (deleteError) throw deleteError;
      
      // Then generate and insert new dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      let availableDates = [];
      let currentDate = start;
      
      while (isBefore(currentDate, end) || currentDate.getTime() === end.getTime()) {
        // Check if it's Monday or Tuesday and not a holiday
        if ((isMonday(currentDate) || isTuesday(currentDate)) && !isHoliday(currentDate)) {
          const dayOfWeek = isMonday(currentDate) ? 1 : 2;
          
          // For each venue and its timeslots on this day of the week
          for (const venue of venues) {
            const timeslotsForDay = venue.timeslots.filter(ts => ts.day_of_week === dayOfWeek);
            
            for (const slot of timeslotsForDay) {
              const dateStr = format(currentDate, "yyyy-MM-dd");
              
              // Create the date entry for the database
              availableDates.push({
                available_date: dateStr,
                is_available: true,
                is_cup_date: false,
                venue_id: venue.venue_id,
                start_time: slot.start_time,
                end_time: slot.end_time
              });
            }
          }
        }
        
        // Move to the next day
        currentDate = addDays(currentDate, 1);
      }
      
      // Batch insert the dates
      if (availableDates.length > 0) {
        const { error: insertError } = await supabase
          .from('available_dates')
          .insert(availableDates);
          
        if (insertError) throw insertError;
      }
      
      toast({
        title: "Speeldata gegenereerd",
        description: `${availableDates.length} speeldata zijn succesvol gegenereerd.`
      });
    } catch (error: any) {
      console.error("Error saving dates:", error);
      toast({
        title: "Fout bij opslaan",
        description: error.message || "Er is een fout opgetreden bij het opslaan van de speeldata.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingDates(false);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
    return days[dayOfWeek] || '';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Competitiebeheer</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="format">1. Format</TabsTrigger>
          <TabsTrigger value="dates">2. Speeldagen</TabsTrigger>
          <TabsTrigger value="preview">3. Voorvertoning</TabsTrigger>
          <TabsTrigger value="management">Beheer</TabsTrigger>
        </TabsList>
        
        {/* Tab 1: Format selecteren */}
        <TabsContent value="format" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitieformat</CardTitle>
              <CardDescription>
                Selecteer het format voor uw competitie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormatSelectionTab
                competitionFormats={competitionFormats}
                loadingFormats={loadingFormats}
                selectedFormat={selectedFormat}
                setSelectedFormat={setSelectedFormat}
                competitionName={competitionName}
                setCompetitionName={setCompetitionName}
                onGenerateSchedule={() => setActiveTab("dates")}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab 2: Speeldagen configureren */}
        <TabsContent value="dates" className="space-y-6">
          {/* 1. Locaties en speeluren */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                  Locaties en speeluren
                </span>
                <Button onClick={addNewVenue} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Locatie toevoegen
                </Button>
              </CardTitle>
              <CardDescription>
                Configureer de beschikbare locaties en tijdsloten voor wedstrijden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {venues.map((venue) => (
                <div key={venue.venue_id} className="rounded-md border p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{venue.name}</h4>
                      <p className="text-sm text-muted-foreground">{venue.address}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => editVenue(venue)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => removeVenue(venue.venue_id!)}>
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Maandag</h5>
                      <ul className="space-y-1">
                        {venue.timeslots
                          .filter(slot => slot.day_of_week === 1)
                          .map((slot, i) => (
                            <li key={`${venue.venue_id}-mon-${i}`} className="text-sm bg-background rounded px-2 py-1">
                              {slot.start_time} - {slot.end_time}
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-2">Dinsdag</h5>
                      <ul className="space-y-1">
                        {venue.timeslots
                          .filter(slot => slot.day_of_week === 2)
                          .map((slot, i) => (
                            <li key={`${venue.venue_id}-tue-${i}`} className="text-sm bg-background rounded px-2 py-1">
                              {slot.start_time} - {slot.end_time}
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 2. Uitzonderingen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                Uitzonderingen - Vakantieperiodes
              </CardTitle>
              <CardDescription>
                Voeg periodes toe waarin geen wedstrijden kunnen plaatsvinden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seizoen periode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-md">
                <div className="space-y-3">
                  <Label htmlFor="start-date">Startdatum seizoen</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="end-date">Einddatum seizoen</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {holidayPeriods.map((period) => (
                  <div key={period.holiday_id} className="flex items-center justify-between rounded-md border p-3 bg-muted/30">
                    <div>
                      <p className="font-medium">{period.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(period.start_date), "d MMMM yyyy", { locale: nl })} - {format(new Date(period.end_date), "d MMMM yyyy", { locale: nl })}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeHolidayPeriod(period.holiday_id!)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md">
                <div>
                  <Label htmlFor="holiday-start">Startdatum</Label>
                  <Input
                    id="holiday-start"
                    type="date"
                    value={newHoliday.start_date}
                    onChange={(e) => setNewHoliday({...newHoliday, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="holiday-end">Einddatum</Label>
                  <Input
                    id="holiday-end"
                    type="date"
                    value={newHoliday.end_date}
                    onChange={(e) => setNewHoliday({...newHoliday, end_date: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="holiday-desc">Omschrijving</Label>
                  <div className="flex gap-2">
                    <Input
                      id="holiday-desc"
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})}
                    />
                    <Button onClick={addHolidayPeriod}>Toevoegen</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Selecteer teams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                Selecteer teams
              </CardTitle>
              <CardDescription>
                Kies welke teams deelnemen aan deze competitie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {teams.map((team) => (
                  <div 
                    key={team.team_id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedTeams.includes(team.team_id) 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-background hover:bg-muted'
                    }`}
                    onClick={() => toggleTeamSelection(team.team_id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{team.team_name}</span>
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes(team.team_id)}
                        onChange={() => toggleTeamSelection(team.team_id)}
                        className="h-4 w-4"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {selectedTeams.length > 0 && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm font-medium">{selectedTeams.length} teams geselecteerd</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Genereer speeldagen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                Speeldagen genereren
              </CardTitle>
              <CardDescription>
                Genereer beschikbare speeldagen op basis van bovenstaande instellingen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={generateDates} className="w-full" disabled={isGeneratingDates}>
                {isGeneratingDates ? (
                  <>Genereren...</>
                ) : (
                  <>
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Genereer beschikbare speeldagen
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab 3: Voorvertoning */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitie Voorvertoning</CardTitle>
              <CardDescription>
                Controleer en bewaar uw competitieschema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PreviewTab
                generatedMatches={generatedMatches}
                competitionName={competitionName}
                selectedDates={[]}
                competitionFormat={competitionFormats?.find(f => f.id === selectedFormat)}
                isCreating={isCreating}
                onSaveCompetition={saveCompetition}
                onRegenerateSchedule={generateSchedule}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab 4: Beheer bestaande competities */}
        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Beheer Competities</CardTitle>
              <CardDescription>
                Overzicht en beheer van bestaande competities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-md">
                <p className="text-muted-foreground">
                  Functionaliteit voor het beheren van bestaande competities komt hier.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Venue Dialog */}
      <Dialog open={showVenueDialog} onOpenChange={setShowVenueDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingVenue ? 'Locatie bewerken' : 'Nieuwe locatie toevoegen'}
            </DialogTitle>
            <DialogDescription>
              Configureer de locatiegegevens en tijdsloten
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="venue-name">Naam</Label>
                <Input
                  id="venue-name"
                  value={newVenue.name}
                  onChange={(e) => setNewVenue({...newVenue, name: e.target.value})}
                  placeholder="Bijv. Harelbeke - Dageraad"
                />
              </div>
              <div>
                <Label htmlFor="venue-address">Adres</Label>
                <Input
                  id="venue-address"
                  value={newVenue.address}
                  onChange={(e) => setNewVenue({...newVenue, address: e.target.value})}
                  placeholder="Bijv. Dageraadstraat 1, 8530 Harelbeke"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Tijdsloten</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Maandag</Label>
                    <Button size="sm" variant="outline" onClick={() => addTimeslot(1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newVenue.timeslots
                      .filter(slot => slot.day_of_week === 1)
                      .map((slot, index) => {
                        const slotIndex = newVenue.timeslots.findIndex(s => s === slot);
                        return (
                          <div key={slotIndex} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={slot.start_time}
                              onChange={(e) => updateTimeslot(slotIndex, 'start_time', e.target.value)}
                              className="w-20"
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={slot.end_time}
                              onChange={(e) => updateTimeslot(slotIndex, 'end_time', e.target.value)}
                              className="w-20"
                            />
                            <Button size="sm" variant="outline" onClick={() => removeTimeslot(slotIndex)}>
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Dinsdag</Label>
                    <Button size="sm" variant="outline" onClick={() => addTimeslot(2)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newVenue.timeslots
                      .filter(slot => slot.day_of_week === 2)
                      .map((slot, index) => {
                        const slotIndex = newVenue.timeslots.findIndex(s => s === slot);
                        return (
                          <div key={slotIndex} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={slot.start_time}
                              onChange={(e) => updateTimeslot(slotIndex, 'start_time', e.target.value)}
                              className="w-20"
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={slot.end_time}
                              onChange={(e) => updateTimeslot(slotIndex, 'end_time', e.target.value)}
                              className="w-20"
                            />
                            <Button size="sm" variant="outline" onClick={() => removeTimeslot(slotIndex)}>
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVenueDialog(false)}>
              Annuleren
            </Button>
            <Button onClick={saveVenue}>
              {editingVenue ? 'Bijwerken' : 'Toevoegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bevestigingsdialoog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bevestig genereren speeldata</DialogTitle>
            <DialogDescription>
              U staat op het punt om alle bestaande speeldata te verwijderen en nieuwe te genereren. Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 rounded-md border p-4">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <p className="text-sm">Alle bestaande speeldata zullen worden verwijderd.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Annuleren</Button>
            <Button variant="destructive" onClick={saveDates}>Doorgaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompetitionManagementTab;
