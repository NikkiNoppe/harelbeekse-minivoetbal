
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Edit, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VENUES } from "@/constants/competitionData";

const VenuesCard: React.FC = () => {
  const { toast } = useToast();
  
  const [editingVenue, setEditingVenue] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '' });

  // Use hardcoded venues data
  const venues = VENUES;

  const handleEdit = (venue: any) => {
    setEditingVenue(venue);
    setFormData({ name: venue.name, address: venue.address });
    setIsAddingNew(false);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingVenue(null);
    setFormData({ name: '', address: '' });
    setIsAddingNew(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    toast({
      title: "Demo modus",
      description: "Wijzigingen worden niet opgeslagen in deze demo versie. Gebruik de Competitiedata tab voor echte bewerking.",
      variant: "destructive",
    });
    setIsDialogOpen(false);
  };

  const handleDelete = async (venue: any) => {
    toast({
      title: "Demo modus",
      description: "Wijzigingen worden niet opgeslagen in deze demo versie. Gebruik de Competitiedata tab voor echte bewerking.",
      variant: "destructive",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Beschikbare Locaties
            </CardTitle>
            <CardDescription>
              Locaties uit de database waar wedstrijden gespeeld kunnen worden
            </CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nieuwe locatie
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {venues.map((venue) => (
            <div key={venue.venue_id} className="p-3 border rounded-lg bg-muted relative group">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <div className="flex-1">
                  <h4 className="font-medium">{venue.name}</h4>
                  <p className="text-sm text-muted-foreground">{venue.address}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(venue)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(venue)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isAddingNew ? 'Nieuwe locatie toevoegen' : 'Locatie bewerken'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="venue-name">Naam</Label>
                <Input
                  id="venue-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Bijv. Sportcomplex Zuid"
                />
              </div>
              <div>
                <Label htmlFor="venue-address">Adres</Label>
                <Input
                  id="venue-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Bijv. Sportlaan 1, 1234 AB Plaats"
                />
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

export default VenuesCard;
