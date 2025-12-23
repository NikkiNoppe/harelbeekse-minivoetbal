import React, { useState, useCallback, useMemo } from "react";
import { AppModal, AppModalHeader, AppModalTitle } from "@/components/ui/app-modal";
import { AppAlertModal } from "@/components/ui/app-alert-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { enhancedCostSettingsService } from "@/services/financial";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Edit, Trash2, Euro, AlertTriangle } from "lucide-react";

interface FinancialSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FinancialSettingsModal: React.FC<FinancialSettingsModalProps> = ({ 
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

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      category: 'penalty'
    });
    setShowAddForm(false);
    setEditingItem(null);
  }, []);

  const handleSave = useCallback(async () => {
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
  }, [formData, editingItem, queryClient, resetForm, toast]);

  const handleDelete = useCallback(async () => {
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
  }, [deletingItem, queryClient, toast]);

  const handleEdit = useCallback((item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      amount: item.amount.toString(),
      category: item.category
    });
    setShowAddForm(true);
  }, []);

  const formatCurrency = useMemo(() => (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }, []);

  const getCategoryLabel = useMemo(() => (category: string) => {
    switch (category) {
      case 'match_cost': return 'Wedstrijdkosten';
      case 'penalty': return 'Boete';
      case 'field_cost': return 'Veldkosten';
      case 'referee_cost': return 'Scheidsrechterkosten';
      case 'other': return 'Overig';
      default: return category;
    }
  }, []);

  const getCategoryColor = useMemo(() => (category: string) => {
    switch (category) {
      case 'match_cost': return 'bg-blue-100 text-blue-800';
      case 'penalty': return 'bg-red-100 text-red-800';
      case 'field_cost': return 'bg-green-100 text-green-800';
      case 'referee_cost': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-muted text-card-foreground';
      default: return 'bg-muted text-card-foreground';
    }
  }, []);

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        size="lg"
        className="max-w-6xl"
      >
        <AppModalHeader>
          <AppModalTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Kostenlijst Beheer
          </AppModalTitle>
          <p className="app-modal-subtitle">Beheer alle kosten en boetes voor het systeem</p>
        </AppModalHeader>
        <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {showAddForm ? (editingItem ? 'Tarief Bewerken' : 'Nieuw Tarief Toevoegen') : 'Acties'}
                </h3>
                <Button 
                  onClick={() => showAddForm ? resetForm() : setShowAddForm(true)}
                  className="btn btn--secondary flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" />
                  {showAddForm ? 'Annuleren' : 'Nieuw Tarief'}
                </Button>
              </div>

              {showAddForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium">Naam *</Label>
                    <Input
                      value={formData.name}
                      onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      placeholder="Naam van het tarief"
                      className="modal__input"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium">Categorie *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={value => setFormData(f => ({ ...f, category: value as 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost' }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="modal__input">
                        <SelectValue placeholder="Selecteer categorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="match_cost">Wedstrijdkosten</SelectItem>
                        <SelectItem value="penalty">Boete</SelectItem>
                        <SelectItem value="field_cost">Veldkosten</SelectItem>
                        <SelectItem value="referee_cost">Scheidsrechterkosten</SelectItem>
                        <SelectItem value="other">Overig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium">Bedrag (€) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      className="modal__input"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label className="font-medium">Beschrijving</Label>
                    <Textarea
                      value={formData.description}
                      onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                      placeholder="Optionele beschrijving..."
                      rows={3}
                      className="modal__input resize-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="md:col-span-2 modal__actions pt-2">
                    <Button 
                      onClick={handleSave}
                      className="btn btn--primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Bezig...' : (editingItem ? 'Bijwerken' : 'Toevoegen')}
                    </Button>
                    <Button 
                      onClick={resetForm}
                      className="btn btn--secondary"
                      disabled={isSubmitting}
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 bg-muted border-b">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Huidige Tarieven
                  {costSettings && (
                    <Badge variant="secondary">
                      {costSettings.length} items
                    </Badge>
                  )}
                </h3>
              </div>
              
              <div className="overflow-x-auto min-w-full">
                <Table className="table min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Beschrijving</TableHead>
                      <TableHead className="text-right">Bedrag</TableHead>
                      <TableHead className="text-center">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Tarieven laden...
                        </TableCell>
                      </TableRow>
                    ) : costSettings && costSettings.length > 0 ? (
                      costSettings.map((setting) => (
                        <TableRow key={setting.id} className="hover:bg-muted">
                          <TableCell className="font-medium">
                            {setting.name}
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(setting.category)}>
                              {getCategoryLabel(setting.category)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate">
                              {setting.description || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(setting.amount)}
                          </TableCell>
                          <TableCell className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              onClick={() => handleEdit(setting)}
                              className="btn btn--outline"
                              disabled={isSubmitting}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setDeletingItem(setting)}
                              className="btn btn--danger"
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nog geen tarieven gedefinieerd
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
      </AppModal>

      <AppAlertModal
        open={!!deletingItem}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
        title="Tarief Verwijderen"
        description={
          <>
            Weet je zeker dat je "{deletingItem?.name}" wilt verwijderen?
            Deze actie kan niet ongedaan gemaakt worden.
          </>
        }
        confirmAction={{
          label: isSubmitting ? 'Verwijderen...' : 'Verwijderen',
          onClick: handleDelete,
          variant: "destructive",
          disabled: isSubmitting,
          loading: isSubmitting,
        }}
        cancelAction={{
          label: "Annuleren",
          onClick: () => setDeletingItem(null),
          variant: "secondary",
          disabled: isSubmitting,
        }}
      />
    </>
  );
};

export default FinancialSettingsModal;
