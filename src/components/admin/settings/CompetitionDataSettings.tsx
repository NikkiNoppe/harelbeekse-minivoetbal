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
import { Settings, Edit, Save, Building, Clock, Calendar, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { seasonService } from "@/services/seasonService";
import type { CompetitionFormat, Venue, VenueTimeslot, VacationPeriod } from "@/services/competitionDataService";

const CompetitionDataSettings: React.FC = () => {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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

  // Load all competition data from JSON file on component mount
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
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Here you would typically save to a config file or database
      // For now, we'll simulate saving to local state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editType === 'format') {
        setFormats(prev => prev.map(f => f.id === editingItem.id ? editingItem : f));
      } else if (editType === 'venue') {
        setVenues(prev => prev.map(v => v.venue_id === editingItem.venue_id ? editingItem : v));
      } else if (editType === 'timeslot') {
        setTimeslots(prev => prev.map(t => t.timeslot_id === editingItem.timeslot_id ? editingItem : t));
      } else if (editType === 'vacation') {
        setVacations(prev => prev.map(v => v.id === editingItem.id ? editingItem : v));
      }
      
      toast({
        title: "Data opgeslagen",
        description: "De competitiedata is succesvol bijgewerkt.",
      });
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

  const handleCancel = () => {
    setEditingItem(null);
    setEditType('');
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Show only HH:MM
  };

  return (
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
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(format, 'format')}
                          >
                            <Edit className="h-3 w-3" />
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
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(venue, 'venue')}
                          >
                            <Edit className="h-3 w-3" />
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
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(slot, 'timeslot')}
                            >
                              <Edit className="h-3 w-3" />
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
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(vacation, 'vacation')}
                          >
                            <Edit className="h-3 w-3" />
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="season-start">Seizoen Startdatum</Label>
                    <Input
                      id="season-start"
                      type="date"
                      value={seasonData.season_start_date}
                      onChange={(e) => setSeasonData({...seasonData, season_start_date: e.target.value})}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Wanneer het seizoen officieel begint
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="season-end">Seizoen Einddatum</Label>
                    <Input
                      id="season-end"
                      type="date"
                      value={seasonData.season_end_date}
                      onChange={(e) => setSeasonData({...seasonData, season_end_date: e.target.value})}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Wanneer het seizoen officieel eindigt
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Huidige Seizoensdata:</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Seizoen:</strong> {seasonData.season_start_date} - {seasonData.season_end_date}</p>
                    <p><strong>Seizoen lengte:</strong> {
                      Math.ceil((new Date(seasonData.season_end_date).getTime() - new Date(seasonData.season_start_date).getTime()) / (1000 * 60 * 60 * 24))
                    } dagen</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={async () => {
                      try {
                        await seasonService.saveSeasonData(seasonData);
                        toast({
                          title: "Seizoensdata opgeslagen",
                          description: "De seizoensdata is succesvol bijgewerkt.",
                        });
                      } catch (error) {
                        toast({
                          title: "Fout bij opslaan",
                          description: "Er is een fout opgetreden bij het opslaan van de seizoensdata.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Seizoensdata Opslaan
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Save All Data Button */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Alle Competitiedata Opslaan</h4>
              <p className="text-sm text-blue-800 mb-4">
                <strong>Belangrijk:</strong> Alle wijzigingen worden opgeslagen in season2025-2026.json. 
                Deze data wordt gebruikt door de hele applicatie.
              </p>
              <div className="flex justify-end">
                <Button 
                  onClick={async () => {
                    try {
                      const allData = {
                        ...seasonData,
                        competition_formats: formats,
                        venues: venues,
                        venue_timeslots: timeslots,
                        vacation_periods: vacations,
                        day_names: dayNames
                      };
                      
                      await seasonService.saveSeasonData(allData);
                      toast({
                        title: "Alle competitiedata opgeslagen",
                        description: "Alle competitiedata is succesvol bijgewerkt in season2025-2026.json.",
                      });
                    } catch (error) {
                      toast({
                        title: "Fout bij opslaan",
                        description: "Er is een fout opgetreden bij het opslaan van de competitiedata.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Alle Data Opslaan
                </Button>
              </div>
            </div>
          </Tabs>

          {editingItem && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>
                  {editType === 'format' && 'Formaat Bewerken'}
                  {editType === 'venue' && 'Locatie Bewerken'}
                  {editType === 'timeslot' && 'Tijdslot Bewerken'}
                  {editType === 'vacation' && 'Vakantieperiode Bewerken'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-100 border border-blue-300 p-3 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Bewerken:</strong> Wijzig de data en klik op opslaan. Wijzigingen worden direct toegepast.
                  </p>
                </div>
                
                {editType === 'format' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="format-name">Naam</Label>
                      <Input
                        id="format-name"
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="format-description">Beschrijving</Label>
                      <Textarea
                        id="format-description"
                        value={editingItem.description || ''}
                        onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="format-playoffs"
                        checked={editingItem.has_playoffs}
                        onCheckedChange={(checked) => setEditingItem({...editingItem, has_playoffs: checked})}
                      />
                      <Label htmlFor="format-playoffs">Heeft playoffs</Label>
                    </div>
                    <div>
                      <Label htmlFor="format-rounds">Aantal rondes</Label>
                      <Input
                        id="format-rounds"
                        type="number"
                        value={editingItem.regular_rounds}
                        onChange={(e) => setEditingItem({...editingItem, regular_rounds: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                )}
                
                {editType === 'venue' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="venue-name">Naam</Label>
                      <Input
                        id="venue-name"
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="venue-address">Adres</Label>
                      <Input
                        id="venue-address"
                        value={editingItem.address}
                        onChange={(e) => setEditingItem({...editingItem, address: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                
                {editType === 'timeslot' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="timeslot-venue">Locatie</Label>
                      <Select value={editingItem.venue_id.toString()} onValueChange={(value) => setEditingItem({...editingItem, venue_id: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
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
                      <Label htmlFor="timeslot-day">Dag van de week</Label>
                      <Select value={editingItem.day_of_week.toString()} onValueChange={(value) => setEditingItem({...editingItem, day_of_week: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                                          {dayNames.map((day, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {day}
                  </SelectItem>
                ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="timeslot-start">Starttijd</Label>
                        <Input
                          id="timeslot-start"
                          type="time"
                          value={editingItem.start_time}
                          onChange={(e) => setEditingItem({...editingItem, start_time: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="timeslot-end">Eindtijd</Label>
                        <Input
                          id="timeslot-end"
                          type="time"
                          value={editingItem.end_time}
                          onChange={(e) => setEditingItem({...editingItem, end_time: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {editType === 'vacation' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="vacation-name">Naam</Label>
                      <Input
                        id="vacation-name"
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vacation-start">Startdatum</Label>
                        <Input
                          id="vacation-start"
                          type="date"
                          value={editingItem.start_date}
                          onChange={(e) => setEditingItem({...editingItem, start_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="vacation-end">Einddatum</Label>
                        <Input
                          id="vacation-end"
                          type="date"
                          value={editingItem.end_date}
                          onChange={(e) => setEditingItem({...editingItem, end_date: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vacation-active"
                        checked={editingItem.is_active}
                        onCheckedChange={(checked) => setEditingItem({...editingItem, is_active: checked})}
                      />
                      <Label htmlFor="vacation-active">Actief</Label>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isLoading} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isLoading ? "Opslaan..." : "Opslaan"}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                    Annuleren
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetitionDataSettings;