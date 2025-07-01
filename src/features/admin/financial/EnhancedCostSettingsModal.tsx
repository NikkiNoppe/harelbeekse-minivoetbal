
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { Textarea } from "@shared/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import { enhancedCostSettingsService } from "@shared/services/enhancedCostSettingsService";
import { useToast } from "@shared/hooks/use-toast";

interface CostSetting {
  id: number;
  name: string;
  description?: string;
  amount: number;
  category: 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EnhancedCostSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EnhancedCostSettingsModal: React.FC<EnhancedCostSettingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newCost, setNewCost] = useState({
    name: "",
    description: "",
    amount: 0,
    category: "expense" as 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost',
  });

  const { data: costSettings = [], isLoading } = useQuery({
    queryKey: ['enhanced-cost-settings'],
    queryFn: enhancedCostSettingsService.getAllCostSettings,
    enabled: open,
  });

  const [editData, setEditData] = useState<Partial<CostSetting>>({});

  const handleAddCost = async () => {
    try {
      await enhancedCostSettingsService.createCostSetting(newCost);
      queryClient.invalidateQueries({ queryKey: ['enhanced-cost-settings'] });
      setNewCost({
        name: "",
        description: "",
        amount: 0,
        category: "expense" as 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost',
      });
      toast({
        title: "Kostenverzameling toegevoegd",
        description: "De nieuwe kostenverzameling is succesvol toegevoegd.",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de kostenverzameling.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (cost: CostSetting) => {
    setEditingId(cost.id);
    setEditData(cost);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editData) return;

    try {
      await enhancedCostSettingsService.updateCostSetting(editingId, editData);
      queryClient.invalidateQueries({ queryKey: ['enhanced-cost-settings'] });
      setEditingId(null);
      setEditData({});
      toast({
        title: "Kostenverzameling bijgewerkt",
        description: "De kostenverzameling is succesvol bijgewerkt.",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de kostenverzameling.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (id: number) => {
    try {
      await enhancedCostSettingsService.deleteCostSetting(id);
      queryClient.invalidateQueries({ queryKey: ['enhanced-cost-settings'] });
      toast({
        title: "Kostenverzameling verwijderd",
        description: "De kostenverzameling is succesvol verwijderd.",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de kostenverzameling.",
        variant: "destructive",
      });
    }
  };

  const totalActive = Array.isArray(costSettings) 
    ? costSettings.filter((cost: CostSetting) => cost.is_active).reduce((sum: number, cost: CostSetting) => sum + cost.amount, 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Uitgebreide Kosten Instellingen</DialogTitle>
          <DialogDescription>
            Beheer alle kostenverzamelingen en hun instellingen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Cost Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold">Nieuwe Kostenverzameling Toevoegen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Naam</Label>
                <Input
                  id="name"
                  value={newCost.name}
                  onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                  placeholder="Kostenverzameling naam"
                />
              </div>
              <div>
                <Label htmlFor="category">Categorie</Label>
                <Select
                  value={newCost.category}
                  onValueChange={(value) => setNewCost({ ...newCost, category: value as 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Uitgave</SelectItem>
                    <SelectItem value="revenue">Inkomst</SelectItem>
                    <SelectItem value="deposit">Storting</SelectItem>
                    <SelectItem value="penalty">Boete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Bedrag (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newCost.amount}
                  onChange={(e) => setNewCost({ ...newCost, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={newCost.description}
                  onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                  placeholder="Optionele beschrijving"
                />
              </div>
            </div>
            <Button onClick={handleAddCost} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Kostenverzameling Toevoegen
            </Button>
          </div>

          {/* Cost Settings Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Bestaande Kostenverzamelingen</h3>
              <div className="text-sm text-muted-foreground">
                Totaal actief: €{totalActive.toFixed(2)}
              </div>
            </div>

            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Bedrag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Beschrijving</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(costSettings) && costSettings.length > 0 ? costSettings.map((cost: CostSetting) => (
                      <TableRow key={cost.id}>
                        <TableCell>
                          {editingId === cost.id ? (
                            <Input
                              value={editData.name || ""}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            />
                          ) : (
                            cost.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === cost.id ? (
                            <Select
                              value={editData.category || cost.category}
                              onValueChange={(value) => setEditData({ ...editData, category: value as 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost' })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="match_cost">Match Kosten</SelectItem>
                                <SelectItem value="penalty">Boete</SelectItem>
                                <SelectItem value="field_cost">Veld Kosten</SelectItem>
                                <SelectItem value="referee_cost">Scheidsrechter Kosten</SelectItem>
                                <SelectItem value="other">Overig</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            cost.category
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === cost.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editData.amount || 0}
                              onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) || 0 })}
                            />
                          ) : (
                            `€${cost.amount.toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>
                          {cost.is_active ? "Actief" : "Inactief"}
                        </TableCell>
                        <TableCell>
                          {editingId === cost.id ? (
                            <Textarea
                              value={editData.description || ""}
                              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            />
                          ) : (
                            cost.description || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === cost.id ? (
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={handleSaveEdit}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(cost)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(cost.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Geen kostenverzamelingen gevonden
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCostSettingsModal;
