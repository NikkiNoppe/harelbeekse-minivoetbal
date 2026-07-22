import React, { useState, useCallback, useMemo } from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import { AppAlertModal, DestructiveConfirmDescription } from "@/components/modals";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { enhancedCostSettingsService, invalidateFinancialTransactionQueries } from "@/services/financial";
import { useToast } from "@/hooks/use-toast";
import { useOrgQueryScope } from "@/hooks/useOrganization";
import { withOrgQueryKey } from "@/lib/orgQueryKey";
import { Settings, Plus, Edit, Trash2 } from "lucide-react";

interface FinancialSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FinancialSettingsModal: React.FC<FinancialSettingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId, orgQueryEnabled } = useOrgQueryScope();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category: "penalty" as "match_cost" | "penalty" | "other" | "field_cost" | "referee_cost",
  });

  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const {
    data: costSettings,
    isLoading,
    isFetched,
    error: costSettingsError,
    refetch: refetchCostSettings,
  } = useQuery({
    queryKey: withOrgQueryKey(["cost-settings-management"], organizationId),
    queryFn: enhancedCostSettingsService.getCostSettings,
    enabled: open && orgQueryEnabled,
    staleTime: 0,
    refetchOnMount: "always",
    retry: 2,
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      amount: "",
      category: "penalty",
    });
    setShowAddForm(false);
    setEditingId(null);
    setEditName("");
    setEditAmount("");
  }, []);

  const handleAddSave = useCallback(async () => {
    if (!formData.name.trim() || !formData.amount) {
      toast({ title: "Fout", description: "Vul alle verplichte velden in", variant: "destructive" });
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "Fout", description: "Voer een geldig bedrag in", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await enhancedCostSettingsService.addCostSetting({
      name: formData.name.trim(),
      amount,
      category: formData.category,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast({ title: "Succesvol", description: result.message });
      queryClient.invalidateQueries({ queryKey: ["cost-settings-management"] });
      queryClient.invalidateQueries({ queryKey: ["cost-settings"] });
      queryClient.invalidateQueries({ queryKey: ["financial-overview"] });
      void invalidateFinancialTransactionQueries(queryClient);
      resetForm();
    } else {
      toast({ title: "Fout", description: result.message, variant: "destructive" });
    }
  }, [formData, queryClient, resetForm, toast]);

  const handleEditSave = useCallback(async () => {
    if (editingId === null) return;
    if (!editName.trim() || !editAmount) {
      toast({ title: "Fout", description: "Vul naam en bedrag in", variant: "destructive" });
      return;
    }
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "Fout", description: "Voer een geldig bedrag in", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await enhancedCostSettingsService.updateCostSetting(editingId, {
      name: editName.trim(),
      amount,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast({ title: "Succesvol", description: result.message });
      queryClient.invalidateQueries({ queryKey: ["cost-settings-management"] });
      queryClient.invalidateQueries({ queryKey: ["cost-settings"] });
      queryClient.invalidateQueries({ queryKey: ["financial-overview"] });
      void invalidateFinancialTransactionQueries(queryClient);
      setEditingId(null);
      setEditName("");
      setEditAmount("");
    } else {
      toast({ title: "Fout", description: result.message, variant: "destructive" });
    }
  }, [editingId, editName, editAmount, queryClient, toast]);

  const handleDelete = useCallback(async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    const result = await enhancedCostSettingsService.deleteCostSetting(deletingItem.id);
    setIsSubmitting(false);
    if (result.success) {
      toast({ title: "Succesvol", description: result.message });
      queryClient.invalidateQueries({ queryKey: ["cost-settings-management"] });
      queryClient.invalidateQueries({ queryKey: ["cost-settings"] });
      void invalidateFinancialTransactionQueries(queryClient);
      setDeletingItem(null);
    } else {
      toast({ title: "Fout", description: result.message, variant: "destructive" });
    }
  }, [deletingItem, queryClient, toast]);

  const handleEdit = useCallback((item: any) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditAmount(item.amount?.toString() || "0");
  }, []);

  const formatCurrency = useMemo(
    () => (amount: number) =>
      new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount),
    [],
  );

  const getCategoryLabel = useMemo(
    () => (category: string) => {
      switch (category) {
        case "match_cost":
          return "Wedstrijdkosten";
        case "penalty":
          return "Boete";
        case "field_cost":
          return "Veldkosten";
        case "referee_cost":
          return "Scheidsrechterkosten";
        case "deposit":
          return "Storting";
        case "other":
          return "Overig";
        default:
          return category;
      }
    },
    [],
  );

  const getCategoryColor = useMemo(
    () => (category: string) => {
      switch (category) {
        case "match_cost":
          return "bg-brand-100 text-brand-800 border-brand-200";
        case "penalty":
          return "bg-destructive/10 text-destructive border-destructive/20";
        case "field_cost":
          return "bg-brand-50 text-brand-dark border-brand-light";
        case "referee_cost":
          return "bg-brand-100 text-brand-800 border-brand-200";
        case "deposit":
          return "bg-green-50 text-green-700 border-green-200";
        case "other":
          return "bg-muted text-card-foreground border-border";
        default:
          return "bg-muted text-card-foreground border-border";
      }
    },
    [],
  );

  return (
    <>
      <AppModal open={open} onOpenChange={onOpenChange} title="Kostenlijst beheer" size="lg">
        <div className="space-y-4">
          {showAddForm && (
            <Card className="border-primary/20 shadow-lg card-hover">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-brand-dark">Naam *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Naam van het tarief"
                    className="modal__input"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-brand-dark">Categorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((f) => ({
                        ...f,
                        category: value as "match_cost" | "penalty" | "other" | "field_cost" | "referee_cost",
                      }))
                    }
                    disabled={isSubmitting}
                  >
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
                    onChange={(e) => setFormData((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="modal__input"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAddSave}
                    className="btn btn--primary w-full min-h-[44px]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Bezig..." : "Toevoegen"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn--secondary w-full min-h-[44px]"
                    disabled={isSubmitting}
                  >
                    Annuleren
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          <button
            type="button"
            onClick={() => (showAddForm ? resetForm() : setShowAddForm(true))}
            className="btn btn--secondary flex items-center justify-center gap-2 w-full min-h-[44px]"
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4" />
            {showAddForm ? "Annuleren" : "Nieuw tarief"}
          </button>

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
                    variant="outline"
                    className="min-h-[44px]"
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
                        editingId === setting.id && "ring-1 ring-primary/30",
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
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              editingId === setting.id ? setEditingId(null) : handleEdit(setting)
                            }
                            className={cn(
                              "min-h-[44px] min-w-[44px] border-primary/20",
                              editingId === setting.id && "bg-brand-50",
                            )}
                            disabled={isSubmitting}
                            aria-label="Bewerk tarief"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setDeletingItem(setting)}
                            className="min-h-[44px] min-w-[44px] border-destructive/30 text-destructive hover:bg-destructive/10"
                            disabled={isSubmitting}
                            aria-label="Verwijder tarief"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {editingId === setting.id && (
                        <div className="mt-3 pt-3 border-t border-primary/20 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-brand-dark">Naam</Label>
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Naam"
                                className="modal__input min-h-[44px]"
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-brand-dark">Bedrag (€)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                placeholder="0.00"
                                className="modal__input min-h-[44px]"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={handleEditSave}
                              className="btn btn--primary flex-1 min-h-[44px]"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? "Bezig..." : "Opslaan"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditName("");
                                setEditAmount("");
                              }}
                              className="btn btn--secondary flex-1 min-h-[44px]"
                              disabled={isSubmitting}
                            >
                              Annuleren
                            </button>
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
          label: isSubmitting ? "Verwijderen..." : "Verwijderen",
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
