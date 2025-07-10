import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Settings, Edit, Save, Building, Clock, Calendar, Trophy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { seasonService } from "@/services/seasonService";
import type { CompetitionFormat, Venue, VenueTimeslot, VacationPeriod } from "@/services/competitionDataService";

const CompetitionDataSettings: React.FC = () => {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<string>('');

  // Local state copies for editing
  const [formats, setFormats] = useState<CompetitionFormat[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [timeslots, setTimeslots] = useState<VenueTimeslot[]>([]);
  const [vacations, setVacations] = useState<VacationPeriod[]>([]);
  const [dayNames, setDayNames] = useState<string[]>([]);
  const [seasonData, setSeasonData] = useState({
    season_start_date: "2024-09-01",
    season_end_date: "2025-06-30"
  });

  // Load all competition data from database/JSON file on component mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const data = await seasonService.getSeasonData();
        
        // Set season data
        setSeasonData({
          season_start_date: data.season_start_date,
          season_end_date: data.season_end_date
        });
        
        // Set competition data from JSON
        if (data.competition_formats) {
          setFormats(data.competition_formats);
        }
        if (data.venues) {
          setVenues(data.venues);
        }
        if (data.venue_timeslots) {
          setTimeslots(data.venue_timeslots);
        }
        if (data.vacation_periods) {
          setVacations(data.vacation_periods);
        }
        if (data.day_names) {
          setDayNames(data.day_names);
        }
      } catch (error) {
        console.error('Error loading competition data:', error);
      }
    };
    
    loadAllData();
  }, []);

  const handleEdit = (item: any, type: string) => {
    setEditingItem({ ...item });
    setEditType(type);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: any, type: string) => {
    setItemToDelete(item);
    setDeleteType(type);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Update local state
      if (editType === 'format') {
        setFormats(prev => prev.map(f => f.id === editingItem.id ? editingItem : f));
      } else if (editType === 'venue') {
        setVenues(prev => prev.map(v => v.venue_id === editingItem.venue_id ? editingItem : v));
      } else if (editType === 'timeslot') {
        setTimeslots(prev => prev.map(t => t.timeslot_id === editingItem.timeslot_id ? editingItem : t));
      } else if (editType === 'vacation') {
        setVacations(prev => prev.map(v => v.id === editingItem.id ? editingItem : v));
      } else if (editType === 'season') {
        setSeasonData(editingItem);
      }

      // Update JSON file
      const currentData = await seasonService.getSeasonData();
      
      // Create updated arrays with the new item
      let updatedFormats = currentData.competition_formats;
      let updatedVenues = currentData.venues;
      let updatedTimeslots = currentData.venue_timeslots;
      let updatedVacations = currentData.vacation_periods;
      
      if (editType === 'format') {
        updatedFormats = currentData.competition_formats.map(f => f.id === editingItem.id ? editingItem : f);
      } else if (editType === 'venue') {
        updatedVenues = currentData.venues.map(v => v.venue_id === editingItem.venue_id ? editingItem : v);
      } else if (editType === 'timeslot') {
        updatedTimeslots = currentData.venue_timeslots.map(t => t.timeslot_id === editingItem.timeslot_id ? editingItem : t);
      } else if (editType === 'vacation') {
        updatedVacations = currentData.vacation_periods.map(v => v.id === editingItem.id ? editingItem : v);
      }
      
      const updatedData = {
        ...currentData,
        competition_formats: updatedFormats,
        venues: updatedVenues,
        venue_timeslots: updatedTimeslots,
        vacation_periods: updatedVacations,
        season_start_date: editType === 'season' ? editingItem.season_start_date : currentData.season_start_date,
        season_end_date: editType === 'season' ? editingItem.season_end_date : currentData.season_end_date,
      };
      
      await seasonService.saveSeasonData(updatedData);
      
      toast({
        title: "Data opgeslagen",
        description: "De competitiedata is succesvol bijgewerkt.",
      });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setEditType('');
    } catch (error) {
      toast({
        title: "Fout bij opslaan",
        description: "Kon data niet opslaan",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsLoading(true);
    try {
      // Update local state
      if (deleteType === 'format') {
        setFormats(prev => prev.filter(f => f.id !== itemToDelete.id));
      } else if (deleteType === 'venue') {
        setVenues(prev => prev.filter(v => v.venue_id !== itemToDelete.venue_id));
        // Also remove related timeslots
        setTimeslots(prev => prev.filter(t => t.venue_id !== itemToDelete.venue_id));
      } else if (deleteType === 'timeslot') {
        setTimeslots(prev => prev.filter(t => t.timeslot_id !== itemToDelete.timeslot_id));
      } else if (deleteType === 'vacation') {
        setVacations(prev => prev.filter(v => v.id !== itemToDelete.id));
      } else if (deleteType === 'season') {
        // Reset to default season data
        setSeasonData({
          season_start_date: "2024-09-01",
          season_end_date: "2025-06-30"
        });
      }

      // Update JSON file
      const currentData = await seasonService.getSeasonData();
      
      // Create updated arrays with the item removed
      let updatedFormats = currentData.competition_formats;
      let updatedVenues = currentData.venues;
      let updatedTimeslots = currentData.venue_timeslots;
      let updatedVacations = currentData.vacation_periods;
      
      if (deleteType === 'format') {
        updatedFormats = currentData.competition_formats.filter(f => f.id !== itemToDelete.id);
      } else if (deleteType === 'venue') {
        updatedVenues = currentData.venues.filter(v => v.venue_id !== itemToDelete.venue_id);
        updatedTimeslots = currentData.venue_timeslots.filter(t => t.venue_id !== itemToDelete.venue_id);
      } else if (deleteType === 'timeslot') {
        updatedTimeslots = currentData.venue_timeslots.filter(t => t.timeslot_id !== itemToDelete.timeslot_id);
      } else if (deleteType === 'vacation') {
        updatedVacations = currentData.vacation_periods.filter(v => v.id !== itemToDelete.id);
      }
      
      const updatedData = {
        ...currentData,
        competition_formats: updatedFormats,
        venues: updatedVenues,
        venue_timeslots: updatedTimeslots,
        vacation_periods: updatedVacations,
        season_start_date: deleteType === 'season' ? "2024-09-01" : currentData.season_start_date,
        season_end_date: deleteType === 'season' ? "2025-06-30" : currentData.season_end_date,
      };
      
      await seasonService.saveSeasonData(updatedData);
      
      toast({
        title: "Item verwijderd",
        description: "Het item is succesvol verwijderd.",
      });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      setDeleteType('');
    } catch (error) {
      toast({
        title: "Fout bij verwijderen",
        description: "Kon item niet verwijderen",
        variant: "destructive"
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
    setItemToDelete(null);
    setDeleteType('');
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Show only HH:MM
  };

  const renderEditForm = () => {
    if (!editingItem || !editType) return null;

    switch (editType) {
      case 'format':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="format-name" className="text-purple-dark">Naam</Label>
              <Input
                id="format-name"
                value={editingItem.name}
                onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                className="bg-white placeholder:text-purple-200"
              />
            </div>
            <div>
              <Label htmlFor="format-description" className="text-purple-dark">Beschrijving</Label>
              <Textarea
                id="format-description"
                value={editingItem.description}
                onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                className="bg-white placeholder:text-purple-200"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="format-playoffs"
                checked={editingItem.has_playoffs}
                onCheckedChange={(checked) => setEditingItem({...editingItem, has_playoffs: checked})}
              />
              <Label htmlFor="format-playoffs" className="text-purple-dark">Heeft playoffs</Label>
            </div>
            <div>
              <Label htmlFor="format-rounds" className="text-purple-dark">Aantal rondes</Label>
              <Input
                id="format-rounds"
                type="number"
                value={editingItem.regular_rounds}
                onChange={(e) => setEditingItem({...editingItem, regular_rounds: parseInt(e.target.value)})}
                className="bg-white placeholder:text-purple-200"
              />
            </div>
          </div>
        );

      case 'venue':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="venue-name" className="text-purple-dark">Naam</Label>
              <Input
                id="venue-name"
                value={editingItem.name}
                onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                className="bg-white placeholder:text-purple-200"
              />
            </div>
            <div>
              <Label htmlFor="venue-address" className="text-purple-dark">Adres</Label>
              <Input
                id="venue-address"
                value={editingItem.address}
                onChange={(e) => setEditingItem({...editingItem, address: e.target.value})}
                className="bg-white placeholder:text-purple-200"
              />
            </div>
          </div>
        );

      case 'timeslot':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="timeslot-venue" className="text-purple-dark">Locatie</Label>
              <Select
                value={editingItem.venue_id.toString()}
                onValueChange={(value) => setEditingItem({...editingItem, venue_id: parseInt(value)})}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {venues.map((venue) => (
                    <SelectItem key={venue.venue_id} value={venue.venue_id.toString()}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timeslot-day" className="text-purple-dark">Dag</Label>
              <Select
                value={editingItem.day_of_week.toString()}
                onValueChange={(value) => setEditingItem({...editingItem, day_of_week: parseInt(value)})}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {dayNames.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timeslot-start" className="text-purple-dark">Starttijd</Label>
              <Input
                id="timeslot-start"
                type="time"
                value={editingItem.start_time}
                onChange={(e) => setEditingItem({...editingItem, start_time: e.target.value})}
                className="bg-white placeholder:text-purple-200"
              />
            </div>
            <div>
              <Label htmlFor="timeslot-end" className="text-purple-dark">Eindtijd</Label>
              <Input
                id="timeslot-end"
                type="time"
                value={editingItem.end_time}
                onChange={(e) => setEditingItem({...editingItem, end_time: e.target.value})}
                className="bg-white placeholder:text-purple-200"
              />
            </div>
          </div>
        );

      case 'vacation':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="vacation-name" className="text-purple-dark">Naam</Label>
              <Input
                id="vacation-name"
                value={editingItem.name}
                onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                className="bg-white placeholder:text-purple-200"
              />
            </div>
            <div>
              <Label htmlFor="vacation-start" className="text-purple-dark">Startdatum</Label>
              <Input
                id="vacation-start"
                type="date"
                value={editingItem.start_date}
                onChange={(e) => setEditingItem({...editingItem, start_date: e.target.value})}
                className="bg-white placeholder:text-purple-200"
              />
            </div>
            <div>
              <Label htmlFor="vacation-end" className="text-purple-dark">Einddatum</Label>
              <Input
                id="vacation-end"
                type="date"
                value={editingItem.end_date}
                onChange={(e) => setEditingItem({...editingItem, end_date: e.target.value})}
                className="bg-white placeholder:text-purple-200"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="vacation-active"
                checked={editingItem.is_active}
                onCheckedChange={(checked) => setEditingItem({...editingItem, is_active: checked})}
              />
              <Label htmlFor="vacation-active" className="text-purple-dark">Actief</Label>
            </div>
          </div>
        );

      case 'season':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="season-start" className="text-purple-dark">Startdatum</Label>
              <Input
                id="season-start"
                type="date"
                value={editingItem.season_start_date}
                onChange={(e) => setEditingItem({...editingItem, season_start_date: e.target.value})}
                className="bg-white placeholder:text-purple-200"
              />
            </div>
            <div>
              <Label htmlFor="season-end" className="text-purple-dark">Einddatum</Label>
              <Input
                id="season-end"
                type="date"
                value={editingItem.season_end_date}
                onChange={(e) => setEditingItem({...editingItem, season_end_date: e.target.value})}
                className="bg-white placeholder:text-purple-200"
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
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Competitiedata Beheer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Beheer de hardcoded competitiedata. Deze data wordt maximaal 1x per jaar gewijzigd.
              <br />
              <strong>Let op:</strong> Wijzigingen vereisen een herstart van de applicatie.
            </p>

            <Tabs defaultValue="formats" className="space-y-4">
              <TabsList>
                <TabsTrigger value="formats" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Formaten
                </TabsTrigger>
                <TabsTrigger value="venues" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Locaties
                </TabsTrigger>
                <TabsTrigger value="timeslots" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tijdslots
                </TabsTrigger>
                <TabsTrigger value="vacations" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Vakanties
                </TabsTrigger>
                <TabsTrigger value="season" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Seizoensdata
                </TabsTrigger>
              </TabsList>

              <TabsContent value="formats">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Competitie Formaten</h3>
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
                          <TableCell className="flex gap-2 justify-end">
                            <Button
                              className="btn-white"
                              size="sm"
                              onClick={() => handleEdit(format, 'format')}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              className="btn-white"
                              size="sm"
                              onClick={() => handleDelete(format, 'format')}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="venues">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sportzalen</h3>
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
                          <TableCell className="flex gap-2 justify-end">
                            <Button
                              className="btn-white"
                              size="sm"
                              onClick={() => handleEdit(venue, 'venue')}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              className="btn-white"
                              size="sm"
                              onClick={() => handleDelete(venue, 'venue')}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="timeslots">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tijdslots per Locatie</h3>
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
                            <TableCell className="flex gap-2 justify-end">
                              <Button
                                className="btn-white"
                                size="sm"
                                onClick={() => handleEdit(slot, 'timeslot')}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                className="btn-white"
                                size="sm"
                                onClick={() => handleDelete(slot, 'timeslot')}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="vacations">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Vakantieperiodes</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Naam</TableHead>
                        <TableHead>Startdatum</TableHead>
                        <TableHead>Einddatum</TableHead>
                        <TableHead>Actief</TableHead>
                        <TableHead>Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vacations.map((vacation) => (
                        <TableRow key={vacation.id}>
                          <TableCell className="font-medium">{vacation.name}</TableCell>
                          <TableCell>{vacation.start_date}</TableCell>
                          <TableCell>{vacation.end_date}</TableCell>
                          <TableCell>{vacation.is_active ? 'Ja' : 'Nee'}</TableCell>
                          <TableCell className="flex gap-2 justify-end">
                            <Button
                              className="btn-white"
                              size="sm"
                              onClick={() => handleEdit(vacation, 'vacation')}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              className="btn-white"
                              size="sm"
                              onClick={() => handleDelete(vacation, 'vacation')}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

                            <TabsContent value="season">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Seizoensdata</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Belangrijk:</strong> Configureer hier de begin- en einddatum van het volledige seizoen 
                      waar gespeeld kan worden. Deze data wordt gebruikt voor het genereren van competitieschema's.
                    </p>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seizoen</TableHead>
                        <TableHead>Startdatum</TableHead>
                        <TableHead>Einddatum</TableHead>
                        <TableHead>Lengte (dagen)</TableHead>
                        <TableHead>Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Seizoen 2025-2026</TableCell>
                        <TableCell>{seasonData.season_start_date}</TableCell>
                        <TableCell>{seasonData.season_end_date}</TableCell>
                        <TableCell>
                          {Math.ceil((new Date(seasonData.season_end_date).getTime() - new Date(seasonData.season_start_date).getTime()) / (1000 * 60 * 60 * 24))}
                        </TableCell>
                        <TableCell className="flex gap-2 justify-end">
                          <Button
                            className="btn-white"
                            size="sm"
                            onClick={() => handleEdit(seasonData, 'season')}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            className="btn-white"
                            size="sm"
                            onClick={() => handleDelete(seasonData, 'season')}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-purple-100 border-purple-light">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-purple-light">Weet je het zeker?</AlertDialogTitle>
            <AlertDialogDescription className="text-purple-dark">
              Deze actie kan niet ongedaan worden gemaakt. Het item zal permanent worden verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} className="btn-light">Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isLoading} className="btn-dark">
              {isLoading ? 'Verwijderen...' : 'Verwijderen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CompetitionDataSettings;