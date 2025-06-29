
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { costSettingsService } from "@/services/costSettingsService";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Edit, Trash2, Euro } from "lucide-react";

interface CostSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CostSettingsModal: React.FC<CostSettingsModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    category: 'penalty' as 'match_cost' | 'penalty' | 'other'
  });

  const { data: costSettings, isLoading } = useQuery({
    queryKey: ['cost-settings'],
    queryFn: costSettingsService.getCostSettings
  });

  const handleSave = async () => {
    if (!formData.name || !formData.amount) {
      toast({
        title: "Fout",
        description: "Vul alle verplichte velden in",
        variant: "destructive"
      });
      return;
    }

    const settingData = {
      name: formData.name,
      description: formData.description || null,
      amount: parseFloat(formData.amount),
      category: formData.category,
      is_active: true
    };

    let result;
    if (editingItem) {
      result = await costSettingsService.updateCostSetting(editingItem.id, settingData);
    } else {
      result = await costSettingsService.addCostSetting(settingData);
    }

    if (result.success) {
      toast({
        title: "Succesvol",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['cost-settings'] });
      resetForm();
    } else {
      toast({
        title: "Fout",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    const result = await costSettingsService.deleteCostSetting(id);
    
    if (result.success) {
      toast({
        title: "Succesvol",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['cost-settings'] });
    } else {
      toast({
        title: "Fout",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      amount: item.amount.toString(),
      category: item.category
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      category: 'penalty'
    });
    setShowAddForm(false);
    setEditingItem(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'match_cost':
        return 'Wedstrijdkosten';
      case 'penalty':
        return 'Boete';
      case 'other':
        return 'Overig';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'match_cost':
        return 'bg-blue-100 text-blue-800';
      case 'penalty':
        return 'bg-red-100 text-red-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Group settings by category
  const groupedSettings = costSettings?.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, any[]>) || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Kostentarieven Beheer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Beheer alle kosten en boetes in het systeem
            </p>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {showAddForm ? 'Annuleren' : 'Nieuw Tarief'}
            </Button>
          </div>

          {showAddForm && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">
                {editingItem ? 'Tarief Bewerken' : 'Nieuw Tarief Toevoegen'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Naam *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Naam van het tarief"
                  />
                </div>

                <div>
                  <Label>Categorie *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: any) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match_cost">Wedstrijdkosten</SelectItem>
                      <SelectItem value="penalty">Boete</SelectItem>
                      <SelectItem value="other">Overig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Bedrag (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Beschrijving</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optionele beschrijving..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleSave}>
                  {editingItem ? 'Bijwerken' : 'Toevoegen'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Annuleren
                </Button>
              </div>
            </div>
          )}

          {/* Settings by Category */}
          {Object.entries(groupedSettings).map(([category, settings]) => (
            <div key={category} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Euro className="h-5 w-5" />
                {getCategoryLabel(category)}
              </h3>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Beschrijving</TableHead>
                    <TableHead className="text-right">Bedrag</TableHead>
                    <TableHead className="text-center">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-medium">{setting.name}</TableCell>
                      <TableCell className="text-gray-600">
                        {setting.description || '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(setting.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(setting)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Bewerken
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(setting.id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Verwijderen
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center justify-center h-40">
              <p>Kostentarieven laden...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CostSettingsModal;
