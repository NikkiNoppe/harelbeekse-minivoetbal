import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { enhancedCostSettingsService } from "@/services/enhancedCostSettingsService";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Edit, Trash2, Euro, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CostSettingsManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CostSettingsManagementModal: React.FC<CostSettingsManagementModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    category: 'penalty' as 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost'
  });

  const { data: costSettings, isLoading } = useQuery({
    queryKey: ['cost-settings-management'],
    queryFn: enhancedCostSettingsService.getCostSettings
  });

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.amount) {
      toast({
        title: "Fout",
        description: "Vul alle verplichte velden in",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Fout",
        description: "Voer een geldig bedrag in",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    const settingData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      amount: amount,
      category: formData.category,
      is_active: true
    };

    let result;
    if (editingItem) {
      result = await enhancedCostSettingsService.updateCostSetting(editingItem.id, settingData);
    } else {
      result = await enhancedCostSettingsService.addCostSetting(settingData);
    }

    setIsSubmitting(false);
    if (result.success) {
      toast({
        title: "Succesvol",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['cost-settings-management'] });
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

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    const result = await enhancedCostSettingsService.deleteCostSetting(deletingItem.id);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Succesvol",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['cost-settings-management'] });
      queryClient.invalidateQueries({ queryKey: ['cost-settings'] });
      setDeletingItem(null);
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
      case 'match_cost': return 'Wedstrijdkosten';
      case 'penalty': return 'Boete';
      case 'field_cost': return 'Veldkosten';
      case 'referee_cost': return 'Scheidsrechterkosten';
      case 'other': return 'Overig';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'match_cost': return 'bg-blue-100 text-blue-800';
      case 'penalty': return 'bg-red-100 text-red-800';
      case 'field_cost': return 'bg-green-100 text-green-800';
      case 'referee_cost': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-fit max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-dark">
              <Euro className="h-5 w-5" />
              Kostenlijst Beheer
            </DialogTitle>
            <DialogDescription className="text-purple-dark/70">
              Beheer alle kosten en boetes voor het systeem
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-purple-dark">
                  {showAddForm ? (editingItem ? 'Tarief Bewerken' : 'Nieuw Tarief Toevoegen') : 'Acties'}
                </h3>
                <Button 
                  onClick={() => showAddForm ? resetForm() : setShowAddForm(true)}
                  className="btn-white btn-sm"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {showAddForm ? 'Annuleren' : 'Nieuw Tarief'}
                </Button>
              </div>

              {showAddForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-purple-dark font-medium">Naam *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Naam van het tarief"
                      className="input-login-style"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-purple-dark font-medium">Categorie *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value: any) => setFormData({...formData, category: value})}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="dropdown-login-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dropdown-content-login-style">
                        <SelectItem value="match_cost" className="dropdown-item-login-style">Wedstrijdkosten</SelectItem>
                        <SelectItem value="penalty" className="dropdown-item-login-style">Boete</SelectItem>
                        <SelectItem value="field_cost" className="dropdown-item-login-style">Veldkosten</SelectItem>
                        <SelectItem value="referee_cost" className="dropdown-item-login-style">Scheidsrechterkosten</SelectItem>
                        <SelectItem value="other" className="dropdown-item-login-style">Overig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-purple-dark font-medium">Bedrag (€) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                      className="input-login-style"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label className="text-purple-dark font-medium">Beschrijving</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Optionele beschrijving..."
                      rows={3}
                      className="input-login-style resize-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="md:col-span-2 flex gap-2 pt-2">
                    <Button 
                      onClick={handleSave}
                      className="btn-dark"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Bezig...' : (editingItem ? 'Bijwerken' : 'Toevoegen')}
                    </Button>
                    <Button 
                      onClick={resetForm}
                      className="btn-white"
                      disabled={isSubmitting}
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-purple-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-purple-50 border-b border-purple-200">
                <h3 className="text-lg font-semibold text-purple-dark flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Huidige Tarieven
                  {costSettings && (
                    <Badge className="bg-purple-100 text-purple-800">
                      {costSettings.length} items
                    </Badge>
                  )}
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-purple-dark">Naam</TableHead>
                      <TableHead className="text-purple-dark">Categorie</TableHead>
                      <TableHead className="text-purple-dark">Beschrijving</TableHead>
                      <TableHead className="text-right text-purple-dark">Bedrag</TableHead>
                      <TableHead className="text-center text-purple-dark">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-purple-dark/60">
                          Tarieven laden...
                        </TableCell>
                      </TableRow>
                    ) : costSettings && costSettings.length > 0 ? (
                      costSettings.map((setting) => (
                        <TableRow key={setting.id} className="hover:bg-purple-50">
                          <TableCell className="font-medium text-purple-dark">
                            {setting.name}
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(setting.category)}>
                              {getCategoryLabel(setting.category)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-purple-dark/70 max-w-xs">
                            <div className="truncate">
                              {setting.description || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-purple-dark">
                            {formatCurrency(setting.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                onClick={() => handleEdit(setting)}
                                className="btn-white btn-sm"
                                disabled={isSubmitting}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => setDeletingItem(setting)}
                                className="btn-white btn-sm hover:!bg-red-500 hover:!text-white hover:!border-red-500"
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-purple-dark/60">
                          Nog geen tarieven gedefinieerd
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-purple-dark">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Tarief Verwijderen
            </AlertDialogTitle>
            <AlertDialogDescription className="text-purple-dark/70">
              Weet je zeker dat je "{deletingItem?.name}" wilt verwijderen? 
              Deze actie kan niet ongedaan gemaakt worden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="btn-white"
              disabled={isSubmitting}
            >
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="btn-dark !bg-red-600 hover:!bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verwijderen...' : 'Verwijderen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CostSettingsManagementModal;
