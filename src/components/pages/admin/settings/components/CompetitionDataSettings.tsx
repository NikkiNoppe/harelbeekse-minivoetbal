import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Edit, Trash2, Trophy, Building, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { seasonService, type SeasonData } from "@/services";

const CompetitionDataSettings: React.FC = () => {
  const { toast } = useToast();
  const [formats, setFormats] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [timeslots, setTimeslots] = useState<any[]>([]);
  const [vacations, setVacations] = useState<any[]>([]);
  const [seasonData, setSeasonData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<string>('');
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<string>('');

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
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      console.log('\uD83D\uDD04 Loading competition data from application_settings...');
      
      // Clear cache to ensure fresh data from database
      seasonService.clearSeasonDataCache();
      
      const data = await seasonService.getSeasonData();
      console.log('\u2705 Competition data loaded:', data);
      
      setFormats(data.competition_formats || []);
      setVenues(data.venues || []);
      setTimeslots(data.venue_timeslots || []);
      setVacations(data.vacation_periods || []);
      setSeasonData({
        season_start_date: data.season_start_date || '',
        season_end_date: data.season_end_date || ''
      });
    } catch (error) {
      console.error('\u274c Error loading competition data:', error);
      toast({
        title: "Fout",
        description: "Kon competitiedata niet laden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: any, type: string) => {
    setEditingItem({ ...item });
    setEditType(type);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: any, type: string) => {
    setDeleteItem(item);
    setDeleteType(type);
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
      
      // Update the appropriate data based on editType
      let updatedData = { ...currentData };
      
      switch (editType) {
        case 'format':
          const updatedFormats = [...(currentData.competition_formats || [])];
          const formatIndex = updatedFormats.findIndex(f => f.id === editingItem.id);
          if (formatIndex >= 0) {
            updatedFormats[formatIndex] = editingItem;
          } else {
            updatedFormats.push(editingItem);
          }
          updatedData.competition_formats = updatedFormats;
          break;
          
        case 'venue':
          const updatedVenues = [...(currentData.venues || [])];
          const venueIndex = updatedVenues.findIndex(v => v.venue_id === editingItem.venue_id);
          if (venueIndex >= 0) {
            updatedVenues[venueIndex] = editingItem;
          } else {
            updatedVenues.push(editingItem);
          }
          updatedData.venues = updatedVenues;
          break;
          
        case 'timeslot':
          const updatedTimeslots = [...(currentData.venue_timeslots || [])];
          const timeslotIndex = updatedTimeslots.findIndex(t => t.timeslot_id === editingItem.timeslot_id);
          if (timeslotIndex >= 0) {
            updatedTimeslots[timeslotIndex] = editingItem;
          } else {
            updatedTimeslots.push(editingItem);
          }
          updatedData.venue_timeslots = updatedTimeslots;
          break;
          
        case 'vacation':
          const updatedVacations = [...(currentData.vacation_periods || [])];
          const vacationIndex = updatedVacations.findIndex(v => v.id === editingItem.id);
          if (vacationIndex >= 0) {
            updatedVacations[vacationIndex] = editingItem;
          } else {
            updatedVacations.push(editingItem);
          }
          updatedData.vacation_periods = updatedVacations;
          break;
          
        case 'season':
          updatedData.season_start_date = editingItem.season_start_date;
          updatedData.season_end_date = editingItem.season_end_date;
          break;
      }
      
      // Save updated season data
      const result = await seasonService.saveSeasonData(updatedData);
      
      if (result.success) {
        toast({
          title: "Succes",
          description: "Wijzigingen opgeslagen",
        });
        
        setIsEditDialogOpen(false);
        setEditingItem(null);
        setEditType('');
        loadAllData(); // Reload data
      } else {
        toast({
          title: "Fout bij opslaan",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon wijzigingen niet opslaan",
        variant: "destructive",
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
      
      // Remove the item based on deleteType
      let updatedData = { ...currentData };
      
      switch (deleteType) {
        case 'format':
          updatedData.competition_formats = (currentData.competition_formats || []).filter(f => f.id !== deleteItem.id);
          break;
          
        case 'venue':
          updatedData.venues = (currentData.venues || []).filter(v => v.venue_id !== deleteItem.venue_id);
          break;
          
        case 'timeslot':
          updatedData.venue_timeslots = (currentData.venue_timeslots || []).filter(t => t.timeslot_id !== deleteItem.timeslot_id);
          break;
          
        case 'vacation':
          updatedData.vacation_periods = (currentData.vacation_periods || []).filter(v => v.id !== deleteItem.id);
          break;
      }
      
      // Save updated season data
      const result = await seasonService.saveSeasonData(updatedData);
      
      if (result.success) {
        toast({
          title: "Succes",
          description: "Item verwijderd",
        });
        
        setIsDeleteDialogOpen(false);
        setDeleteItem(null);
        setDeleteType('');
        loadAllData(); // Reload data
      } else {
        toast({
          title: "Fout bij verwijderen",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon item niet verwijderen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditDialogOpen(false);
    setEditingItem(null);
    setEditType('');
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setDeleteItem(null);
    setDeleteType('');
  };

  const formatTime = (time: string) => {
    return time;
  };

  const renderEditForm = () => {
    if (!editingItem) return null;

    switch (editType) {
      case 'format':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="formatName">Naam</Label>
              <Input 
                id="formatName" 
                value={editingItem.name || ''} 
                onChange={(e) => updateEditingItem('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="formatDescription">Beschrijving</Label>
              <Input 
                id="formatDescription" 
                value={editingItem.description || ''} 
                onChange={(e) => updateEditingItem('description', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="formatPlayoffs">Playoffs</Label>
              <Select 
                value={editingItem.has_playoffs ? "true" : "false"}
                onValueChange={(value) => updateEditingItem('has_playoffs', value === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ja</SelectItem>
                  <SelectItem value="false">Nee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="formatRounds">Rondes</Label>
              <Input 
                id="formatRounds" 
                type="number" 
                value={editingItem.regular_rounds || ''} 
                onChange={(e) => updateEditingItem('regular_rounds', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        );
      case 'venue':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="venueName">Naam</Label>
              <Input 
                id="venueName" 
                value={editingItem.name || ''} 
                onChange={(e) => updateEditingItem('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="venueAddress">Adres</Label>
              <Input 
                id="venueAddress" 
                value={editingItem.address || ''} 
                onChange={(e) => updateEditingItem('address', e.target.value)}
              />
            </div>
          </div>
        );
      case 'timeslot':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="timeslotVenue">Locatie</Label>
              <Select 
                value={editingItem.venue_id?.toString() || ''}
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
                value={editingItem.day_of_week?.toString() || ''}
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
            <div>
              <Label htmlFor="timeslotStart">Starttijd</Label>
              <Input 
                id="timeslotStart" 
                type="time" 
                value={editingItem.start_time || ''} 
                onChange={(e) => updateEditingItem('start_time', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="timeslotEnd">Eindtijd</Label>
              <Input 
                id="timeslotEnd" 
                type="time" 
                value={editingItem.end_time || ''} 
                onChange={(e) => updateEditingItem('end_time', e.target.value)}
              />
            </div>
          </div>
        );
      case 'vacation':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="vacationName">Naam</Label>
              <Input 
                id="vacationName" 
                value={editingItem.name || ''} 
                onChange={(e) => updateEditingItem('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vacationStart">Startdatum</Label>
              <Input 
                id="vacationStart" 
                type="date" 
                value={editingItem.start_date || ''} 
                onChange={(e) => updateEditingItem('start_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vacationEnd">Einddatum</Label>
              <Input 
                id="vacationEnd" 
                type="date" 
                value={editingItem.end_date || ''} 
                onChange={(e) => updateEditingItem('end_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vacationActive">Actief</Label>
              <Select 
                value={editingItem.is_active ? "true" : "false"}
                onValueChange={(value) => updateEditingItem('is_active', value === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ja</SelectItem>
                  <SelectItem value="false">Nee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'season':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="seasonStart">Startdatum</Label>
              <Input 
                id="seasonStart" 
                type="date" 
                value={editingItem.season_start_date || ''} 
                onChange={(e) => updateEditingItem('season_start_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="seasonEnd">Einddatum</Label>
              <Input 
                id="seasonEnd" 
                type="date" 
                value={editingItem.season_end_date || ''} 
                onChange={(e) => updateEditingItem('season_end_date', e.target.value)}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Competitiedata Beheer
            </div>
            <Button 
              onClick={loadAllData} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? 'Laden...' : 'Ververs'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Beheer alle competitie gerelateerde data. Deze data wordt maximaal 1x per jaar gewijzigd.
              <br />
              <strong>Let op:</strong> Wijzigingen vereisen een herstart van de applicatie.
            </p>

            <div className="space-y-6">
              {/* Formaten */}
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5" />
                  Competitie Formaten
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Beschrijving</TableHead>
                      <TableHead>Playoffs</TableHead>
                      <TableHead>Rondes</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formats.map((format) => (
                      <TableRow key={format.id}>
                        <TableCell className="font-medium">{format.name}</TableCell>
                        <TableCell>{format.description}</TableCell>
                        <TableCell>{format.has_playoffs ? 'Ja' : 'Nee'}</TableCell>
                        <TableCell>{format.regular_rounds}</TableCell>
                        <TableCell className="action-buttons">
                          <Button
                            className="btn-action-edit"
                            onClick={() => handleEdit(format, 'format')}
                          >
                            <Edit />
                          </Button>
                          <Button
                            className="btn-action-delete"
                            onClick={() => handleDelete(format, 'format')}
                          >
                            <Trash2 />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Locaties */}
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5" />
                  Sportzalen
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Adres</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venues.map((venue) => (
                      <TableRow key={venue.venue_id}>
                        <TableCell className="font-medium">{venue.name}</TableCell>
                        <TableCell>{venue.address}</TableCell>
                        <TableCell className="action-buttons">
                          <Button
                            className="btn-action-edit"
                            onClick={() => handleEdit(venue, 'venue')}
                          >
                            <Edit />
                          </Button>
                          <Button
                            className="btn-action-delete"
                            onClick={() => handleDelete(venue, 'venue')}
                          >
                            <Trash2 />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Tijdslots */}
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5" />
                  Tijdslots per Locatie
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Locatie</TableHead>
                      <TableHead>Dag</TableHead>
                      <TableHead>Starttijd</TableHead>
                      <TableHead>Eindtijd</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeslots.map((slot) => {
                      const venue = venues.find(v => v.venue_id === slot.venue_id);
                      return (
                        <TableRow key={slot.timeslot_id}>
                          <TableCell className="font-medium">{venue?.name}</TableCell>
                          <TableCell>{dayNames[slot.day_of_week] || `Dag ${slot.day_of_week}`}</TableCell>
                          <TableCell>{formatTime(slot.start_time)}</TableCell>
                          <TableCell>{formatTime(slot.end_time)}</TableCell>
                          <TableCell className="action-buttons">
                            <Button
                              className="btn-action-edit"
                              onClick={() => handleEdit(slot, 'timeslot')}
                            >
                              <Edit />
                            </Button>
                            <Button
                              className="btn-action-delete"
                              onClick={() => handleDelete(slot, 'timeslot')}
                            >
                              <Trash2 />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Vakanties */}
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5" />
                  Vakantieperiodes
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Startdatum</TableHead>
                      <TableHead>Einddatum</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vacations.map((vacation) => (
                      <TableRow key={vacation.id}>
                        <TableCell className="font-medium">{vacation.name}</TableCell>
                        <TableCell>{new Date(vacation.start_date).toLocaleDateString('nl-NL')}</TableCell>
                        <TableCell>{new Date(vacation.end_date).toLocaleDateString('nl-NL')}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            vacation.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {vacation.is_active ? 'Actief' : 'Inactief'}
                          </span>
                        </TableCell>
                        <TableCell className="action-buttons">
                          <Button
                            className="btn-action-edit"
                            onClick={() => handleEdit(vacation, 'vacation')}
                          >
                            <Edit />
                          </Button>
                          <Button
                            className="btn-action-delete"
                            onClick={() => handleDelete(vacation, 'vacation')}
                          >
                            <Trash2 />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Seizoensdata */}
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5" />
                  Seizoensperiode
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-purple-200 rounded-lg bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-purple-600">Startdatum</h4>
                        <p className="text-sm text-gray-600">{new Date(seasonData.season_start_date).toLocaleDateString('nl-NL')}</p>
                      </div>
                      <Button
                        className="btn-action-edit"
                        onClick={() => handleEdit(seasonData, 'season')}
                      >
                        <Edit />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 border border-purple-200 rounded-lg bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-purple-600">Einddatum</h4>
                        <p className="text-sm text-gray-600">{new Date(seasonData.season_end_date).toLocaleDateString('nl-NL')}</p>
                      </div>
                      <Button
                        className="btn-action-edit"
                        onClick={() => handleEdit(seasonData, 'season')}
                      >
                        <Edit />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-purple-100 border-purple-light">
          <DialogHeader className="bg-purple-100">
            <DialogTitle className="text-xl text-center text-purple-light">
              {editType === 'format' && 'Bewerk Formaat'}
              {editType === 'venue' && 'Bewerk Locatie'}
              {editType === 'timeslot' && 'Bewerk Tijdslot'}
              {editType === 'vacation' && 'Bewerk Vakantie'}
              {editType === 'season' && 'Bewerk Seizoensdata'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 bg-purple-100 p-4 sm:p-6">
            {renderEditForm()}
          </div>
          <DialogFooter className="bg-purple-100 p-4">
            <Button className="btn-light" onClick={handleCancel}>
              Annuleren
            </Button>
            <Button className="btn-dark" onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-red-50 border-red-200">
          <DialogHeader className="bg-red-50">
            <DialogTitle className="text-xl text-center text-red-600">
              Bevestig Verwijdering
            </DialogTitle>
            <DialogDescription className="text-center text-red-700">
              Weet je zeker dat je dit item wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-red-50 p-4">
            <Button className="btn-light" onClick={handleDeleteCancel}>
              Annuleren
            </Button>
            <Button className="btn-red-600 hover:bg-red-700" onClick={handleDeleteConfirm} disabled={isLoading}>
              {isLoading ? 'Verwijderen...' : 'Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompetitionDataSettings; 