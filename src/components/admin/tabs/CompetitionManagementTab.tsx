
import React, { useState } from "react";
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
  id: string;
  name: string;
  address: string;
  timeslots: Timeslot[];
}

interface Timeslot {
  day: 'monday' | 'tuesday';
  startTime: string;
  endTime: string;
}

interface HolidayPeriod {
  startDate: string;
  endDate: string;
  description: string;
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
    id: "",
    name: "",
    address: "",
    timeslots: []
  });
  
  const [venues, setVenues] = useState<Venue[]>([
    {
      id: "harelbeke",
      name: "Harelbeke - Dageraad",
      address: "Dageraadstraat 1, 8530 Harelbeke",
      timeslots: [
        { day: 'monday', startTime: '18:30', endTime: '19:30' },
        { day: 'monday', startTime: '19:30', endTime: '20:30' },
        { day: 'monday', startTime: '20:30', endTime: '21:30' },
        { day: 'tuesday', startTime: '18:30', endTime: '19:30' },
        { day: 'tuesday', startTime: '19:30', endTime: '20:30' }
      ]
    },
    {
      id: "bavikhove",
      name: "Bavikhove - Vlasschaard",
      address: "Vlietestraat 25, 8531 Bavikhove",
      timeslots: [
        { day: 'monday', startTime: '18:30', endTime: '19:30' },
        { day: 'monday', startTime: '19:30', endTime: '20:30' },
        { day: 'monday', startTime: '20:30', endTime: '21:30' },
        { day: 'tuesday', startTime: '18:30', endTime: '19:30' }
      ]
    }
  ]);
  
  const [holidayPeriods, setHolidayPeriods] = useState<HolidayPeriod[]>([
    { startDate: "2025-12-23", endDate: "2026-01-06", description: "Kerstvakantie" },
    { startDate: "2026-04-06", endDate: "2026-04-19", description: "Paasvakantie" }
  ]);

  const [newHoliday, setNewHoliday] = useState<HolidayPeriod>({
    startDate: "",
    endDate: "",
    description: ""
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

  // Add a new holiday period
  const addHolidayPeriod = () => {
    if (!newHoliday.startDate || !newHoliday.endDate || !newHoliday.description) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle velden in voor de vakantieperiode",
        variant: "destructive"
      });
      return;
    }

    setHolidayPeriods([...holidayPeriods, { ...newHoliday }]);
    setNewHoliday({ startDate: "", endDate: "", description: "" });
  };

  // Remove a holiday period
  const removeHolidayPeriod = (index: number) => {
    const updatedPeriods = [...holidayPeriods];
    updatedPeriods.splice(index, 1);
    setHolidayPeriods(updatedPeriods);
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
      id: "",
      name: "",
      address: "",
      timeslots: []
    });
    setShowVenueDialog(true);
  };

  // Save venue changes
  const saveVenue = () => {
    if (!newVenue.name || !newVenue.address) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul naam en adres in voor de locatie",
        variant: "destructive"
      });
      return;
    }

    if (editingVenue) {
      // Update existing venue
      setVenues(venues.map(v => v.id === editingVenue.id ? newVenue : v));
    } else {
      // Add new venue
      const id = newVenue.name.toLowerCase().replace(/\s+/g, '-');
      setVenues([...venues, { ...newVenue, id }]);
    }

    setShowVenueDialog(false);
    setEditingVenue(null);
  };

  // Remove venue
  const removeVenue = (venueId: string) => {
    setVenues(venues.filter(v => v.id !== venueId));
  };

  // Add timeslot to venue
  const addTimeslot = (day: 'monday' | 'tuesday') => {
    setNewVenue({
      ...newVenue,
      timeslots: [...newVenue.timeslots, { day, startTime: '18:30', endTime: '19:30' }]
    });
  };

  // Remove timeslot
  const removeTimeslot = (index: number) => {
    const updatedTimeslots = [...newVenue.timeslots];
    updatedTimeslots.splice(index, 1);
    setNewVenue({ ...newVenue, timeslots: updatedTimeslots });
  };

  // Update timeslot
  const updateTimeslot = (index: number, field: keyof Timeslot, value: string) => {
    const updatedTimeslots = [...newVenue.timeslots];
    updatedTimeslots[index] = { ...updatedTimeslots[index], [field]: value };
    setNewVenue({ ...newVenue, timeslots: updatedTimeslots });
  };

  // Check if a date falls within any holiday period
  const isHoliday = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return holidayPeriods.some(period => 
      isBefore(new Date(period.startDate), new Date(dateStr)) && 
      isBefore(new Date(dateStr), new Date(period.endDate))
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
      let weeklyCount = 0;
      
      while (isBefore(currentDate, end) || currentDate.getTime() === end.getTime()) {
        // Check if it's Monday or Tuesday
        if ((isMonday(currentDate) || isTuesday(currentDate)) && !isHoliday(currentDate)) {
          // Reset weekly counter on Monday
          if (isMonday(currentDate)) {
            weeklyCount = 0;
          }
          
          // For each venue and its timeslots on this day of the week
          for (const venue of venues) {
            const day = isMonday(currentDate) ? 'monday' : 'tuesday';
            const timeslotsForDay = venue.timeslots.filter(ts => ts.day === day);
            
            for (const slot of timeslotsForDay) {
              if (weeklyCount < 9) { // Maximum 9 slots per week
                const dateStr = format(currentDate, "yyyy-MM-dd");
                
                // Create the date entry for the database
                availableDates.push({
                  available_date: dateStr,
                  is_available: true,
                  is_cup_date: false
                });
                
                weeklyCount++;
              }
            }
          }
        }
        
        // Move to the next day
        currentDate = addDays(currentDate, 1);
      }
      
      // Filter out any duplicate dates (same day but different venues or times)
      const uniqueDates = Array.from(
        new Map(availableDates.map(date => [date.available_date, date])).values()
      );
      
      // Batch insert the dates
      const { error: insertError } = await supabase
        .from('available_dates')
        .insert(uniqueDates);
        
      if (insertError) throw insertError;
      
      toast({
        title: "Speeldata gegenereerd",
        description: `${uniqueDates.length} speeldata zijn succesvol gegenereerd.`
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
                <div key={venue.id} className="rounded-md border p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{venue.name}</h4>
                      <p className="text-sm text-muted-foreground">{venue.address}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => editVenue(venue)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => removeVenue(venue.id)}>
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Maandag</h5>
                      <ul className="space-y-1">
                        {venue.timeslots
                          .filter(slot => slot.day === 'monday')
                          .map((slot, i) => (
                            <li key={`${venue.id}-mon-${i}`} className="text-sm bg-background rounded px-2 py-1">
                              {slot.startTime} - {slot.endTime}
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-2">Dinsdag</h5>
                      <ul className="space-y-1">
                        {venue.timeslots
                          .filter(slot => slot.day === 'tuesday')
                          .map((slot, i) => (
                            <li key={`${venue.id}-tue-${i}`} className="text-sm bg-background rounded px-2 py-1">
                              {slot.startTime} - {slot.endTime}
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
                {holidayPeriods.map((period, index) => (
                  <div key={index} className="flex items-center justify-between rounded-md border p-3 bg-muted/30">
                    <div>
                      <p className="font-medium">{period.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(period.startDate), "d MMMM yyyy", { locale: nl })} - {format(new Date(period.endDate), "d MMMM yyyy", { locale: nl })}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeHolidayPeriod(index)}
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
                    value={newHoliday.startDate}
                    onChange={(e) => setNewHoliday({...newHoliday, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="holiday-end">Einddatum</Label>
                  <Input
                    id="holiday-end"
                    type="date"
                    value={newHoliday.endDate}
                    onChange={(e) => setNewHoliday({...newHoliday, endDate: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="holiday-desc">Omschrijving</Label>
                  <div className="flex gap-2">
                    <Input
                      id="holiday-desc"
                      value={newHoliday.description}
                      onChange={(e) => setNewHoliday({...newHoliday, description: e.target.value})}
                    />
                    <Button onClick={addHolidayPeriod}>Toevoegen</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Genereer speeldagen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
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
                    <Button size="sm" variant="outline" onClick={() => addTimeslot('monday')}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newVenue.timeslots
                      .filter(slot => slot.day === 'monday')
                      .map((slot, index) => {
                        const mondayIndex = newVenue.timeslots.findIndex(s => s === slot);
                        return (
                          <div key={mondayIndex} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateTimeslot(mondayIndex, 'startTime', e.target.value)}
                              className="w-20"
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateTimeslot(mondayIndex, 'endTime', e.target.value)}
                              className="w-20"
                            />
                            <Button size="sm" variant="outline" onClick={() => removeTimeslot(mondayIndex)}>
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
                    <Button size="sm" variant="outline" onClick={() => addTimeslot('tuesday')}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newVenue.timeslots
                      .filter(slot => slot.day === 'tuesday')
                      .map((slot, index) => {
                        const tuesdayIndex = newVenue.timeslots.findIndex(s => s === slot);
                        return (
                          <div key={tuesdayIndex} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateTimeslot(tuesdayIndex, 'startTime', e.target.value)}
                              className="w-20"
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateTimeslot(tuesdayIndex, 'endTime', e.target.value)}
                              className="w-20"
                            />
                            <Button size="sm" variant="outline" onClick={() => removeTimeslot(tuesdayIndex)}>
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
