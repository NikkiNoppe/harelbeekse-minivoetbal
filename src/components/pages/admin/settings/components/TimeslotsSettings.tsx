import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AppModal, AppModalHeader, AppModalTitle, AppModalFooter } from "@/components/modals";
import { AppAlertModal } from "@/components/modals";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Edit, Trash2, Clock, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { competitionDataService } from "@/services";
import { seasonService } from "@/services";

const TimeslotsSettings: React.FC = () => {
  const { toast } = useToast();
  const [timeslots, setTimeslots] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const dayNames: { [key: number]: string } = {
    1: 'Maandag',
    2: 'Dinsdag', 
    3: 'Woensdag',
    4: 'Donderdag',
    5: 'Vrijdag',
    6: 'Zaterdag',
    0: 'Zondag'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('\uD83D\uDD04 Loading timeslots and venues...');
      const [timeslotsData, venuesData] = await Promise.all([
        competitionDataService.getVenueTimeslots(),
        competitionDataService.getVenues()
      ]);
      console.log('\u2705 Timeslots loaded:', timeslotsData);
      console.log('\u2705 Venues loaded:', venuesData);
      setTimeslots(timeslotsData);
      setVenues(venuesData);
    } catch (error) {
      console.error('\u274c Error loading data:', error);
      toast({
        title: "Fout",
        description: "Kon tijdslots niet laden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem({ ...item });
    setIsEditDialogOpen(true);
  };

  const handleAdd = () => {
    const newTimeslot = {
      timeslot_id: Date.now(), // Temporary ID
      venue_id: venues[0]?.venue_id || 1,
      day_of_week: 1,
      start_time: "19:00",
      end_time: "20:30",
      priority: timeslots.length + 1
    };
    setEditingItem(newTimeslot);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: any) => {
    setDeleteItem(item);
    setIsDeleteDialogOpen(true);
  };

  const updateEditingItem = (field: string, value: any) => {
    setEditingItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Get current season data
      const currentData = await seasonService.getSeasonData();
      
      // Update timeslots in season data
      const updatedTimeslots = currentData.venue_timeslots || [];
      const existingIndex = updatedTimeslots.findIndex(t => t.timeslot_id === editingItem.timeslot_id);
      
      // Add venue name to timeslot
      const venue = venues.find(v => v.venue_id === editingItem.venue_id);
      const timeslotWithVenueName = {
        ...editingItem,
        venue_name: venue?.name || 'Unknown'
      };
      
      if (existingIndex >= 0) {
        updatedTimeslots[existingIndex] = timeslotWithVenueName;
      } else {
        updatedTimeslots.push(timeslotWithVenueName);
      }
      
      // Save updated season data
      const result = await seasonService.saveSeasonData({
        ...currentData,
        venue_timeslots: updatedTimeslots
      });
      
      if (result.success) {
        toast({
          title: "Tijdslot opgeslagen",
          description: result.message,
        });
        
        setIsEditDialogOpen(false);
        setEditingItem(null);
        loadData(); // Reload data
      } else {
        toast({
          title: "Fout bij opslaan",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fout bij opslaan",
        description: "Kon tijdslot niet opslaan",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsLoading(true);
    try {
      // Get current season data
      const currentData = await seasonService.getSeasonData();
      
      // Remove timeslot from season data
      const updatedTimeslots = (currentData.venue_timeslots || []).filter(t => t.timeslot_id !== deleteItem.timeslot_id);
      
      // Save updated season data
      const result = await seasonService.saveSeasonData({
        ...currentData,
        venue_timeslots: updatedTimeslots
      });
      
      if (result.success) {
        toast({
          title: "Tijdslot verwijderd",
          description: result.message,
        });
        
        setIsDeleteDialogOpen(false);
        setDeleteItem(null);
        loadData(); // Reload data
      } else {
        toast({
          title: "Fout bij verwijderen",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fout bij verwijderen",
        description: "Kon tijdslot niet verwijderen",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setDeleteItem(null);
  };

  const getVenueName = (venueId: number) => {
    const venue = venues.find(v => v.venue_id === venueId);
    return venue?.name || 'Onbekend';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tijdslots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Beheer de tijdslots per locatie waar wedstrijden kunnen worden gespeeld.
              <br />
              <strong>Let op:</strong> Wijzigingen vereisen een herstart van de applicatie.
            </p>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Tijdslots</h3>
              <Button onClick={handleAdd} className="btn-dark">
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Tijdslot
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Locatie</TableHead>
                  <TableHead>Dag</TableHead>
                  <TableHead>Tijd</TableHead>
                  <TableHead>Prioriteit</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeslots.map((timeslot) => (
                  <TableRow key={timeslot.timeslot_id}>
                    <TableCell className="font-medium">
                      {getVenueName(timeslot.venue_id)}
                    </TableCell>
                    <TableCell>{dayNames[timeslot.day_of_week]}</TableCell>
                    <TableCell>
                      {timeslot.start_time} - {timeslot.end_time}
                    </TableCell>
                    <TableCell>{timeslot.priority || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          className="btn btn--icon btn--edit"
                          onClick={() => handleEdit(timeslot)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          className="btn btn--icon btn--danger"
                          onClick={() => handleDelete(timeslot)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <AppModal
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title={editingItem?.timeslot_id ? 'Bewerk Tijdslot' : 'Nieuwe Tijdslot'}
        size="sm"
        primaryAction={{
          label: isLoading ? 'Opslaan...' : 'Opslaan',
          onClick: handleSave,
          variant: "primary",
          disabled: isLoading,
          loading: isLoading,
        }}
        secondaryAction={{
          label: "Annuleren",
          onClick: handleCancel,
          variant: "secondary",
        }}
      >
            <div className="space-y-4">
              <div>
                <Label htmlFor="timeslotVenue">Locatie</Label>
                <Select 
                  value={editingItem?.venue_id?.toString() || ''}
                  onValueChange={(value) => updateEditingItem('venue_id', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map(venue => (
                      <SelectItem key={venue.venue_id} value={venue.venue_id.toString()}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="timeslotDay">Dag</Label>
                <Select 
                  value={editingItem?.day_of_week?.toString() || '1'}
                  onValueChange={(value) => updateEditingItem('day_of_week', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(dayNames).map(([day, name]) => (
                      <SelectItem key={day} value={day}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Starttijd</Label>
                  <Input 
                    id="startTime" 
                    type="time" 
                    value={editingItem?.start_time || ''} 
                    onChange={(e) => updateEditingItem('start_time', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">Eindtijd</Label>
                  <Input 
                    id="endTime" 
                    type="time" 
                    value={editingItem?.end_time || ''} 
                    onChange={(e) => updateEditingItem('end_time', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="priority">Prioriteit</Label>
                <Input 
                  id="priority" 
                  type="number" 
                  min="1"
                  value={editingItem?.priority || ''} 
                  onChange={(e) => updateEditingItem('priority', parseInt(e.target.value))}
                />
              </div>
            </div>
      </AppModal>

      {/* Delete Confirmation Dialog */}
      <AppAlertModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Bevestig Verwijdering"
        description="Weet je zeker dat je deze tijdslot wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
        confirmAction={{
          label: isLoading ? 'Verwijderen...' : 'Verwijderen',
          onClick: handleDeleteConfirm,
          variant: "destructive",
          disabled: isLoading,
          loading: isLoading,
        }}
        cancelAction={{
          label: "Annuleren",
          onClick: handleDeleteCancel,
          variant: "secondary",
        }}
      />
    </>
  );
};

export default TimeslotsSettings; 