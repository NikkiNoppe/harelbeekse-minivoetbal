import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Edit, Trash2, Calendar, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { competitionDataService } from "@/services";
import { seasonService } from "@/services";

const VacationsSettings: React.FC = () => {
  const { toast } = useToast();
  const [vacations, setVacations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  useEffect(() => {
    loadVacations();
  }, []);

  const loadVacations = async () => {
    setIsLoading(true);
    try {
      console.log('\uD83D\uDD04 Loading vacation periods...');
      const vacationsData = await competitionDataService.getVacationPeriods();
      console.log('\u2705 Vacation periods loaded:', vacationsData);
      setVacations(vacationsData);
    } catch (error) {
      console.error('\u274c Error loading vacation periods:', error);
      toast({
        title: "Fout",
        description: "Kon vakantieperiodes niet laden",
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
    const newVacation = {
      id: Date.now(), // Temporary ID
      name: '',
      start_date: '',
      end_date: '',
      is_active: true
    };
    setEditingItem(newVacation);
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
      
      // Update vacation periods in season data
      const updatedVacations = currentData.vacation_periods || [];
      const existingIndex = updatedVacations.findIndex(v => v.id === editingItem.id);
      
      if (existingIndex >= 0) {
        updatedVacations[existingIndex] = editingItem;
      } else {
        updatedVacations.push(editingItem);
      }
      
      // Save updated season data
      const result = await seasonService.saveSeasonData({
        ...currentData,
        vacation_periods: updatedVacations
      });
      
      if (result.success) {
        toast({
          title: "Vakantieperiode opgeslagen",
          description: result.message,
        });
        
        setIsEditDialogOpen(false);
        setEditingItem(null);
        loadVacations(); // Reload data
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
        description: "Kon vakantieperiode niet opslaan",
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
      
      // Remove vacation period from season data
      const updatedVacations = (currentData.vacation_periods || []).filter(v => v.id !== deleteItem.id);
      
      // Save updated season data
      const result = await seasonService.saveSeasonData({
        ...currentData,
        vacation_periods: updatedVacations
      });
      
      if (result.success) {
        toast({
          title: "Vakantieperiode verwijderd",
          description: result.message,
        });
        
        setIsDeleteDialogOpen(false);
        setDeleteItem(null);
        loadVacations(); // Reload data
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
        description: "Kon vakantieperiode niet verwijderen",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Vakantieperiodes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Beheer de vakantieperiodes waar geen wedstrijden worden gespeeld.
              <br />
              <strong>Let op:</strong> Wijzigingen vereisen een herstart van de applicatie.
            </p>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Vakantieperiodes</h3>
              <Button onClick={handleAdd} className="btn-dark">
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Vakantieperiode
              </Button>
            </div>

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
                    <TableCell>{formatDate(vacation.start_date)}</TableCell>
                    <TableCell>{formatDate(vacation.end_date)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        vacation.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {vacation.is_active ? 'Actief' : 'Inactief'}
                      </span>
                    </TableCell>
                    <TableCell className="action-buttons">
                      <Button
                        className="btn-action-edit"
                        onClick={() => handleEdit(vacation)}
                      >
                        <Edit />
                      </Button>
                      <Button
                        className="btn-action-delete"
                        onClick={() => handleDelete(vacation)}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-purple-100 border-purple-light mx-4 sm:mx-auto">
          <DialogHeader className="bg-purple-100">
            <DialogTitle className="text-xl text-center text-purple-light">
              {editingItem?.id ? 'Bewerk Vakantieperiode' : 'Nieuwe Vakantieperiode'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 bg-purple-100 p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="vacationName">Naam</Label>
                <Input 
                  id="vacationName" 
                  value={editingItem?.name || ''} 
                  onChange={(e) => updateEditingItem('name', e.target.value)}
                  placeholder="Bijv. Kerstvakantie"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Startdatum</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={editingItem?.start_date || ''} 
                    onChange={(e) => updateEditingItem('start_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Einddatum</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={editingItem?.end_date || ''} 
                    onChange={(e) => updateEditingItem('end_date', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={editingItem?.is_active || false}
                  onCheckedChange={(checked) => updateEditingItem('is_active', checked)}
                />
                <Label htmlFor="isActive">Actief</Label>
              </div>
            </div>
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
        <DialogContent className="sm:max-w-[425px] bg-red-50 border-red-200 mx-4 sm:mx-auto">
          <DialogHeader className="bg-red-50">
            <DialogTitle className="text-xl text-center text-red-600">
              Bevestig Verwijdering
            </DialogTitle>
            <DialogDescription className="text-center text-red-700">
              Weet je zeker dat je deze vakantieperiode wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-red-50 p-4">
            <Button className="btn-light" onClick={handleDeleteCancel}>
              Annuleren
            </Button>
            <Button className="btn-delete" onClick={handleDeleteConfirm} disabled={isLoading}>
              {isLoading ? 'Verwijderen...' : 'Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VacationsSettings; 