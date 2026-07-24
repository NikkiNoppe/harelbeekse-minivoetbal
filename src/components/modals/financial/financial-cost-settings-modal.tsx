
import React, { useState } from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import { AppAlertModal, DestructiveConfirmDescription } from "@/components/modals";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { costSettingsService, invalidateFinancialTransactionQueries } from "@/services/financial";
import { useToast } from "@/hooks/use-toast";
import { useOrgQueryScope } from "@/hooks/useOrganization";
import { withOrgQueryKey } from "@/lib/orgQueryKey";
import { Settings, Plus, Edit, Trash2, Euro } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialCostSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_FORM = {
  name: '',
  amount: '',
  category: 'penalty' as 'match_cost' | 'penalty' | 'other',
};

export const FinancialCostSettingsModal: React.FC<FinancialCostSettingsModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId, orgQueryEnabled } = useOrgQueryScope();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const { 
    data: costSettings, 
    isLoading,
    isFetched,
    error: costSettingsError,
    refetch: refetchCostSettings 
  } = useQuery({
    queryKey: withOrgQueryKey(['cost-settings'], organizationId),
    queryFn: costSettingsService.getCostSettings,
    enabled: open && orgQueryEnabled,
    staleTime: 0,
    refetchOnMount: "always",
    retry: 2,
  });

  const invalidateAll = () => {
    void invalidateFinancialTransactionQueries(queryClient);
    queryClient.invalidateQueries({ queryKey: ["cost-settings"] });
    queryClient.invalidateQueries({ queryKey: ["financial-overview"] });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.amount) {
      toast({ title: "Fout", description: "Vul alle verplichte velden in", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const settingData = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
    };

    let result;
    if (editingId) {
      result = await costSettingsService.updateCostSetting(editingId, settingData);
    } else {
      result = await costSettingsService.addCostSetting(settingData);
    }

    setIsSaving(false);

    if (result.success) {
      toast({ title: "Succesvol", description: result.message });
      invalidateAll();
      resetForm();
    } else {
      toast({ title: "Fout", description: result.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsSaving(true);
    const result = await costSettingsService.deleteCostSetting(deletingItem.id);
    setIsSaving(false);
    if (result.success) {
      toast({ title: "Succesvol", description: result.message });
      invalidateAll();
      if (editingId === deletingItem.id) resetForm();
      setDeletingItem(null);
    } else {
      toast({ title: "Fout", description: result.message, variant: "destructive" });
    }
  };

  const handleEdit = (item: any) => {
    // Close add form if open
    setShowAddForm(false);
    setEditingId(item.id);
    setFormData({
      name: item.name,
      amount: item.amount?.toString() || '0',
      category: item.category
    });
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setShowAddForm(!showAddForm);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);

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
      case 'match_cost': return 'bg-brand-100 text-brand-800 border-brand-200';
      case 'penalty': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'field_cost': return 'bg-brand-50 text-brand-dark border-brand-light';
      case 'referee_cost': return 'bg-brand-100 text-brand-800 border-brand-200';
      case 'other': return 'bg-muted text-card-foreground border-border';
      default: return 'bg-muted text-card-foreground border-border';
    }
  };

  return (
    <>
      <AppModal open={open} onOpenChange={onOpenChange} title="Kostentarieven Beheer" size="lg">
        <div className="space-y-4">
          {/* Add Form */}
          {showAddForm && (
            <Card className="border-primary/20 shadow-lg card-hover">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-brand-dark">Naam *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Naam van het tarief"
                    className="modal__input"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-brand-dark">Categorie *</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })} disabled={isSaving}>
                    <SelectTrigger className="modal__input min-h-[44px]">
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

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-brand-dark">Bedrag (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="modal__input"
                    disabled={isSaving}
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={handleSave}
                    variant="unstyled"
                    className="btn btn--primary w-full min-h-[44px]"
                    disabled={isSaving}
                  >
                    {isSaving ? "Bezig..." : editingId ? "Opslaan" : "Toevoegen"}
                  </Button>
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={resetForm}
                    className="btn btn--secondary w-full min-h-[44px]"
                    disabled={isSaving}
                  >
                    Annuleren
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            type="button"
            onClick={handleAddNew}
            variant="unstyled"
            className="btn btn--secondary flex items-center justify-center gap-2 w-full min-h-[44px]"
            disabled={isSaving}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {showAddForm ? "Annuleren" : "Nieuw tarief"}
          </Button>

          {/* Cost Settings List */}
          <Card className="border-primary/20 shadow-lg card-hover">
            <CardHeader className="p-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-brand-dark">
                <Settings className="h-4 w-4" />
                Huidige tarieven
                {costSettings && (
                  <Badge variant="secondary" className="text-xs">
                    {costSettings.length} items
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {isLoading && !costSettings ? (
                <div className="text-center py-8 text-muted-foreground" aria-busy="true">
                  Tarieven laden...
                </div>
              ) : costSettingsError && isFetched ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-destructive">Tarieven konden niet geladen worden.</p>
                  <Button
                    type="button"
                    variant="unstyled"
                    className="btn btn--secondary min-h-[44px]"
                    onClick={() => void refetchCostSettings()}
                  >
                    Opnieuw proberen
                  </Button>
                </div>
              ) : costSettings && costSettings.length > 0 ? (
                <ul className="space-y-2">
                  {costSettings.map((setting) => (
                    <li
                      key={setting.id}
                      className={cn(
                        "rounded-lg border border-primary/20 bg-card p-3 transition-shadow hover:shadow-sm",
                        editingId === setting.id && "ring-1 ring-primary/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col min-w-0 flex-1 gap-1">
                          <p className="text-sm font-medium text-brand-dark truncate">{setting.name}</p>
                          <Badge className={cn("w-fit border", getCategoryColor(setting.category))}>
                            {getCategoryLabel(setting.category)}
                          </Badge>
                        </div>
                        <span className="text-sm font-semibold text-brand-dark tabular-nums whitespace-nowrap shrink-0">
                          {setting.amount == null
                            ? "Variabel"
                            : formatCurrency(Number(setting.amount))}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => editingId === setting.id ? resetForm() : handleEdit(setting)}
                            className={cn(
                              "btn btn--icon btn--edit",
                              editingId === setting.id && "bg-brand-50"
                            )}
                            disabled={isSaving}
                            aria-label="Bewerk tarief"
                          >
                            <Edit className="h-4 w-4" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => setDeletingItem(setting)}
                            className="btn btn--icon btn--danger"
                            disabled={isSaving}
                            aria-label="Verwijder tarief"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </Button>
                        </div>
                      </div>

                      {editingId === setting.id && (
                        <div className="mt-3 pt-3 border-t border-primary/20 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-brand-dark">Naam</Label>
                              <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Naam"
                                className="modal__input min-h-[44px]"
                                disabled={isSaving}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-brand-dark">Bedrag (€)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                className="modal__input min-h-[44px]"
                                disabled={isSaving}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              type="button"
                              onClick={handleSave}
                              variant="unstyled"
                              className="btn btn--primary flex-1 min-h-[44px]"
                              disabled={isSaving}
                            >
                              {isSaving ? "Bezig..." : "Opslaan"}
                            </Button>
                            <Button
                              type="button"
                              variant="unstyled"
                              onClick={resetForm}
                              className="btn btn--secondary flex-1 min-h-[44px]"
                              disabled={isSaving}
                            >
                              Annuleren
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nog geen tarieven gedefinieerd
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppModal>

      <AppAlertModal
        open={!!deletingItem}
        onOpenChange={(openState) => {
          if (!openState) setDeletingItem(null);
        }}
        title="Tarief verwijderen"
        description={
          <DestructiveConfirmDescription
            message={
              <>
                Weet je zeker dat je{" "}
                <span className="font-semibold text-destructive">{deletingItem?.name}</span>{" "}
                wilt verwijderen?
              </>
            }
          />
        }
        confirmAction={{
          label: isSaving ? "Verwijderen..." : "Verwijderen",
          onClick: handleDelete,
          variant: "destructive",
          disabled: isSaving,
          loading: isSaving,
        }}
        cancelAction={{
          label: "Annuleren",
          onClick: () => setDeletingItem(null),
          variant: "secondary",
          disabled: isSaving,
        }}
      />
    </>
  );
};
