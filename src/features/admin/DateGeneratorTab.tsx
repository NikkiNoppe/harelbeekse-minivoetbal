
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { CalendarIcon, CalendarCheck, Trash, AlertCircle } from "lucide-react";
import { useToast } from "@shared/hooks/use-toast";
import { Label } from "@shared/components/ui/label";
import { format, addDays, isBefore, isMonday, isTuesday } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@shared/integrations/supabase/client";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";

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

interface DateGeneratorTabProps {
  onDatesGenerated?: () => void;
}

const DateGeneratorTab: React.FC<DateGeneratorTabProps> = ({ onDatesGenerated }) => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("2025-08-18");
  const [endDate, setEndDate] = useState("2026-07-14");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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
    setIsGenerating(true);
    
    try {
      // Generate dates logic similar to existing code but simpler
      setShowConfirmDialog(true);
    } catch (error) {
      console.error("Error generating dates:", error);
      toast({
        title: "Fout bij genereren",
        description: "Er is een fout opgetreden bij het genereren van de speeldata.",
        variant: "destructive"
      });
      setIsGenerating(false);
    }
  };
  
  // Save generated dates to the database
  const saveDates = async () => {
    setIsGenerating(true);
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
        if ((isMonday(currentDate) || isTuesday(currentDate)) && !isHoliday(currentDate)) {
          if (isMonday(currentDate)) {
            weeklyCount = 0;
          }
          
          for (const venue of venues) {
            const day = isMonday(currentDate) ? 'monday' : 'tuesday';
            const timeslotsForDay = venue.timeslots.filter(ts => ts.day === day);
            
            for (const slot of timeslotsForDay) {
              if (weeklyCount < 9) {
                const dateStr = format(currentDate, "yyyy-MM-dd");
                
                availableDates.push({
                  available_date: dateStr,
                  is_available: true,
                  is_cup_date: false,
                  venue_id: venue.id,
                  start_time: slot.startTime,
                  end_time: slot.endTime
                });
                
                weeklyCount++;
              }
            }
          }
        }
        
        currentDate = addDays(currentDate, 1);
      }
      
      // Filter out duplicates by date
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

      // Trigger the callback to go to preview tab
      if (onDatesGenerated) {
        onDatesGenerated();
      }
    } catch (error: any) {
      console.error("Error saving dates:", error);
      toast({
        title: "Fout bij opslaan",
        description: error.message || "Er is een fout opgetreden bij het opslaan van de speeldata.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Clean up mock data from database
  const cleanupMockDataHandler = async () => {
    try {
      // Simple cleanup implementation
      const { error } = await supabase
        .from('available_dates')
        .delete()
        .gte('date_id', 0);
      
      if (error) throw error;
      
      toast({
        title: "Mock data opgeschoond",
        description: "Alle test data is succesvol verwijderd uit de database."
      });
    } catch (error: any) {
      toast({
        title: "Fout bij opschonen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van de mock data.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Automatische Speeldata Generator
          </CardTitle>
          <CardDescription>
            Genereer beschikbare speeldata voor het hele seizoen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="start-date">Startdatum</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="end-date">Einddatum</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="border rounded-md p-4 space-y-4">
            <h3 className="font-medium">Vakantieperiodes</h3>
            <p className="text-sm text-muted-foreground">
              Voeg vakantieperiodes toe waarin geen wedstrijden kunnen plaatsvinden
            </p>

            <div className="space-y-3">
              {holidayPeriods.map((period, index) => (
                <div key={index} className="flex items-center justify-between rounded-md border p-2">
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          </div>

          <div className="border rounded-md p-4 space-y-4">
            <h3 className="font-medium">Locaties en tijdsloten</h3>
            <p className="text-sm text-muted-foreground">
              De volgende locaties en tijdsloten zullen worden gebruikt voor het genereren
            </p>

            {venues.map((venue) => (
              <div key={venue.id} className="rounded-md border p-4">
                <h4 className="font-medium">{venue.name}</h4>
                <p className="text-sm text-muted-foreground">{venue.address}</p>
                
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium">Maandag</h5>
                    <ul className="list-disc list-inside text-sm pl-2">
                      {venue.timeslots
                        .filter(slot => slot.day === 'monday')
                        .map((slot, i) => (
                          <li key={`${venue.id}-mon-${i}`}>
                            {slot.startTime} - {slot.endTime}
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium">Dinsdag</h5>
                    <ul className="list-disc list-inside text-sm pl-2">
                      {venue.timeslots
                        .filter(slot => slot.day === 'tuesday')
                        .map((slot, i) => (
                          <li key={`${venue.id}-tue-${i}`}>
                            {slot.startTime} - {slot.endTime}
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={generateDates} className="w-full" disabled={isGenerating}>
            {isGenerating ? (
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
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash className="h-5 w-5 text-primary" />
            Data Cleanup
          </CardTitle>
          <CardDescription>
            Verwijder test data uit de database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Verwijder mock data</h3>
                  <p className="text-sm text-muted-foreground">
                    Dit zal alle test data uit het systeem verwijderen maar behoudt de structuur
                  </p>
                </div>
                <Button variant="destructive" onClick={cleanupMockDataHandler}>
                  <Trash className="mr-2 h-4 w-4" />
                  Data opschonen
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

export default DateGeneratorTab;
