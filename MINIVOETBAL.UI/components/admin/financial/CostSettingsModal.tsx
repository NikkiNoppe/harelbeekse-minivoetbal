
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../MINIVOETBAL.UI/components/ui/dialog";
import { Button } from "../../../MINIVOETBAL.UI/components/ui/button";
import { Input } from "../../../MINIVOETBAL.UI/components/ui/input";
import { Label } from "../../../MINIVOETBAL.UI/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../MINIVOETBAL.UI/components/ui/select";
import { Textarea } from "../../../MINIVOETBAL.UI/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../MINIVOETBAL.UI/components/ui/table";
import { Badge } from "../../../MINIVOETBAL.UI/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { costSettingsService } from "../../MINIVOETBAL.SERVICES/financial/costSettingsService";
import { useToast } from "../../../MINIVOETBAL.UI/hooks/use-toast";
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-purple-100 border-purple-light">
        <DialogHeader className="bg-purple-100">
          <DialogTitle className="flex items-center gap-2 text-purple-light">
            <Settings className="h-5 w-5" />
            Kostentarieven Beheer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 bg-purple-100 p-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-purple-dark">
              Beheer alle kosten en boetes in het systeem
            </p>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 btn-dark"
            >
              <Plus className="h-4 w-4" />
              {showAddForm ? 'Annuleren' : 'Nieuw Tarief'}
            </Button>
          </div>

          {showAddForm && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-light">
              <h3 className="text-lg font-semibold mb-4 text-purple-light">
                {editingItem ? 'Tarief Bewerken' : 'Nieuw Tarief Toevoegen'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-purple-dark">Naam *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Naam van het tarief"
                    className="bg-white placeholder:text-purple-200"
                  />
                </div>

                <div>
                  <Label className="text-purple-dark">Categorie *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: any) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="match_cost">Wedstrijdkosten</SelectItem>
                      <SelectItem value="penalty">Boete</SelectItem>
                      <SelectItem value="other">Overig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-purple-dark">Bedrag (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    className="bg-white placeholder:text-purple-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-purple-dark">Beschrijving</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optionele beschrijving..."
                    rows={2}
                    className="bg-white placeholder:text-purple-200"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleSave} className="btn-dark">
                  {editingItem ? 'Bijwerken' : 'Toevoegen'}
                </Button>
                <Button onClick={resetForm} className="btn-light">
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
                      <TableCell className="flex gap-2 justify-end">
                        <Button
                          className="btn-white"
                          size="sm"
                          onClick={() => handleEdit(setting)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          className="btn-white"
                          size="sm"
                          onClick={() => handleDelete(setting.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
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
