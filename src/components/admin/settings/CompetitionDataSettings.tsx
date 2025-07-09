import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Edit, Save, Building, Clock, Calendar, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  COMPETITION_FORMATS,
  VENUES,
  VENUE_TIMESLOTS,
  VACATION_PERIODS,
  DAY_NAMES,
  type CompetitionFormat,
  type Venue,
  type VenueTimeslot,
  type VacationPeriod
} from "@/constants/competitionData";

const CompetitionDataSettings: React.FC = () => {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<string>('');

  // Local state copies for editing
  const [formats, setFormats] = useState([...COMPETITION_FORMATS]);
  const [venues, setVenues] = useState([...VENUES]);
  const [timeslots, setTimeslots] = useState([...VENUE_TIMESLOTS]);
  const [vacations, setVacations] = useState([...VACATION_PERIODS]);

  const handleEdit = (item: any, type: string) => {
    setEditingItem({ ...item });
    setEditType(type);
  };

  const handleSave = () => {
    // This would normally save to a file or configuration
    // For now, we'll just show a toast
    toast({
      title: "Opgeslagen",
      description: "Competitiedata succesvol bijgewerkt. Herstart de applicatie om wijzigingen toe te passen.",
    });
    
    setEditingItem(null);
    setEditType('');
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
                          <TableCell>{DAY_NAMES[slot.day_of_week]}</TableCell>
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
          </Tabs>

          {editingItem && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle>
                  {editType === 'format' && 'Formaat Bewerken'}
                  {editType === 'venue' && 'Locatie Bewerken'}
                  {editType === 'timeslot' && 'Tijdslot Bewerken'}
                  {editType === 'vacation' && 'Vakantieperiode Bewerken'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-100 border border-yellow-300 p-3 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Belangrijk:</strong> Dit is een demonstratie interface. In productie zou deze data 
                    worden opgeslagen in een configuratiebestand dat geladen wordt bij opstarten.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Opslaan (Demo)
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
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