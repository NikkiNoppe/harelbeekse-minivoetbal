import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Edit, Trash2, Building, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { competitionDataService } from "@/services";
import { seasonService } from "@/services";

const VenuesSettings: React.FC = () => {
  const { toast } = useToast();
  const [venues, setVenues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    setIsLoading(true);
    try {
      console.log('\uD83D\uDD04 Loading venues...');
      const venuesData = await competitionDataService.getVenues();
      console.log('\u2705 Venues loaded:', venuesData);
      setVenues(venuesData);
    } catch (error) {
      console.error('\u274c Error loading venues:', error);
      toast({
        title: "Fout",
        description: "Kon locaties niet laden",
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
    const newVenue = {
      venue_id: Date.now(), // Temporary ID
      name: '',
      address: ''
    };
    setEditingItem(newVenue);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: any) => {
    setDeleteItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Get current season data
      const currentData = await seasonService.getSeasonData();
      
      // Update venues in season data
      const updatedVenues = currentData.venues || [];
      const existingIndex = updatedVenues.findIndex(v => v.venue_id === editingItem.venue_id);
      
      if (existingIndex >= 0) {
        updatedVenues[existingIndex] = editingItem;
      } else {
        updatedVenues.push(editingItem);
      }
      
      // Save updated season data
      const result = await seasonService.saveSeasonData({
        ...currentData,
        venues: updatedVenues
      });
      
      if (result.success) {
        toast({
          title: "Locatie opgeslagen",
          description: result.message,
        });
        
        setIsEditDialogOpen(false);
        setEditingItem(null);
        loadVenues(); // Reload data
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
        description: "Kon locatie niet opslaan",
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
      
      // Remove venue from season data
      const updatedVenues = (currentData.venues || []).filter(v => v.venue_id !== deleteItem.venue_id);
      
      // Save updated season data
      const result = await seasonService.saveSeasonData({
        ...currentData,
        venues: updatedVenues
      });
      
      if (result.success) {
        toast({
          title: "Locatie verwijderd",
          description: result.message,
        });
        
        setIsDeleteDialogOpen(false);
        setDeleteItem(null);
        loadVenues(); // Reload data
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
        description: "Kon locatie niet verwijderen",
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sportzalen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Beheer de sportzalen waar wedstrijden worden gespeeld.
              <br />
              <strong>Let op:</strong> Wijzigingen vereisen een herstart van de applicatie.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Sportzalen</h3>
                <Button onClick={handleAdd} className="btn-dark">
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Locatie
                </Button>
              </div>
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
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            className="btn btn--icon"
                            onClick={() => handleEdit(venue)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            className="btn btn--icon btn--danger"
                            onClick={() => handleDelete(venue)}
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
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="modal">
          <DialogHeader className="bg-purple-100">
            <DialogTitle className="text-xl text-center text-purple-light">
              {editingItem?.venue_id ? 'Bewerk Locatie' : 'Nieuwe Locatie'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 bg-purple-100 p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="venueName">Naam</Label>
                <Input 
                  id="venueName" 
                  value={editingItem?.name || ''} 
                  onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="venueAddress">Adres</Label>
                <Input 
                  id="venueAddress" 
                  value={editingItem?.address || ''} 
                  onChange={(e) => setEditingItem(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="modal__actions">
            <Button className="btn btn--primary" onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Opslaan...' : 'Opslaan'}
            </Button>
            <Button className="btn btn--secondary" onClick={handleCancel}>
              Annuleren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="modal">
          <DialogHeader className="bg-red-50">
            <DialogTitle className="text-xl text-center text-red-600">
              Bevestig Verwijdering
            </DialogTitle>
            <DialogDescription className="text-center text-red-700">
              Weet je zeker dat je deze locatie wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="modal__actions">
            <Button className="btn btn--danger" onClick={handleDeleteConfirm} disabled={isLoading}>
              {isLoading ? 'Verwijderen...' : 'Verwijderen'}
            </Button>
            <Button className="btn btn--secondary" onClick={handleDeleteCancel}>
              Annuleren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VenuesSettings; 