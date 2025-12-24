import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AppModal, AppModalHeader, AppModalTitle, AppModalFooter } from "@/components/modals";
import { AppAlertModal } from "@/components/modals";
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
                <Button onClick={handleAdd} className="btn btn--primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Toevoegen
                </Button>
              </div>
              <div className="w-full overflow-x-auto">
                <div className="min-w-[600px]">
                  <Table className="table w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Naam</TableHead>
                        <TableHead className="min-w-[300px]">Adres</TableHead>
                        <TableHead className="text-center min-w-[120px]">Acties</TableHead>
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
                            className="btn btn--icon btn--edit"
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <AppModal
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title={editingItem?.venue_id ? 'Bewerk Locatie' : 'Nieuwe Locatie'}
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
      </AppModal>

      {/* Delete Confirmation Dialog */}
      <AppAlertModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Bevestig Verwijdering"
        description="Weet je zeker dat je deze locatie wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
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

export default VenuesSettings; 