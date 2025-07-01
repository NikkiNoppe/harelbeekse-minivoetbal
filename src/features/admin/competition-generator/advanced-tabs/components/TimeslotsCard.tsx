import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/components/ui/dialog";
import { Clock, Calendar, Edit, Plus, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@shared/integrations/supabase/client";
import { useToast } from "@shared/hooks/use-toast";

const TimeslotsCard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingTimeslot, setEditingTimeslot] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    venue_id: '',
    day_of_week: '',
    start_time: '',
    end_time: ''
  });

  // Fetch venues for dropdown
  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('venue_id, name')
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
          venue_id,
          venues!inner(name)
        `)
        .order('day_of_week, start_time');
      
      if (error) throw error;
      return data;
    }
  });

  const playDays = [
    { value: 1, label: 'Maandag' },
    { value: 2, label: 'Dinsdag' }
  ];

  const handleEdit = (timeslot: any) => {
    setEditingTimeslot(timeslot);
    setFormData({
      venue_id: timeslot.venue_id.toString(),
      day_of_week: timeslot.day_of_week.toString(),
      start_time: timeslot.start_time,
      end_time: timeslot.end_time
    });
    setIsAddingNew(false);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTimeslot(null);
    setFormData({
      venue_id: '',
      day_of_week: '',
      start_time: '',
      end_time: ''
    });
    setIsAddingNew(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.venue_id || !formData.day_of_week || !formData.start_time || !formData.end_time) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return;
    }

    try {
      const timeslotData = {
        venue_id: parseInt(formData.venue_id),
        day_of_week: parseInt(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time
      };

      if (isAddingNew) {
        const { error } = await supabase
          .from('venue_timeslots')
          .insert(timeslotData);
        
        if (error) throw error;
        
        toast({
          title: "Speeltijd toegevoegd",
          description: "De speeltijd is succesvol toegevoegd",
        });
      } else {
        const { error } = await supabase
          .from('venue_timeslots')
          .update(timeslotData)
          .eq('timeslot_id', editingTimeslot.timeslot_id);
        
        if (error) throw error;
        
        toast({
          title: "Speeltijd bijgewerkt",
          description: "De speeltijd is succesvol bijgewerkt",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['venue-timeslots'] });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving timeslot:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van de speeltijd.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (timeslot: any) => {
    if (!confirm(`Weet je zeker dat je deze speeltijd wilt verwijderen?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('venue_timeslots')
        .delete()
        .eq('timeslot_id', timeslot.timeslot_id);
      
      if (error) throw error;
      
      toast({
        title: "Speeltijd verwijderd",
        description: "De speeltijd is succesvol verwijderd",
      });
      
      queryClient.invalidateQueries({ queryKey: ['venue-timeslots'] });
    } catch (error) {
      console.error('Error deleting timeslot:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de speeltijd.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Beschikbare Speeltijden
            </CardTitle>
            <CardDescription>
              Tijdstippen per locatie en dag uit de database
            </CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nieuwe speeltijd
          </Button>
        </div>
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
                    <div key={slot.timeslot_id} className="p-2 border rounded text-center bg-muted text-sm relative group">
                      <div className="font-medium">{slot.venues.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {slot.start_time} - {slot.end_time}
                      </div>
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(slot)}
                          className="h-5 w-5 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(slot)}
                          className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isAddingNew ? 'Nieuwe speeltijd toevoegen' : 'Speeltijd bewerken'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="venue-select">Locatie</Label>
                <Select value={formData.venue_id} onValueChange={(value) => setFormData({ ...formData, venue_id: value })}>
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
              <div>
                <Label htmlFor="day-select">Dag</Label>
                <Select value={formData.day_of_week} onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer dag" />
                  </SelectTrigger>
                  <SelectContent>
                    {playDays.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Start tijd</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">Eind tijd</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button onClick={handleSave}>
                  {isAddingNew ? 'Toevoegen' : 'Opslaan'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TimeslotsCard;
