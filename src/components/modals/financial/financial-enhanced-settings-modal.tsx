
import React, { useState } from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import { AppAlertModal, DestructiveConfirmDescription } from "@/components/modals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Edit, Trash2, Plus, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { enhancedCostSettingsService } from "@/services/financial";
import { useOrgQueryScope } from "@/hooks/useOrganization";
import { withOrgQueryKey } from "@/lib/orgQueryKey";
import { FinancialAffectedTransactionsModal } from "./financial-affected-transactions-modal";

interface FinancialEnhancedSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FinancialEnhancedSettingsModal: React.FC<FinancialEnhancedSettingsModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId, orgQueryEnabled } = useOrgQueryScope();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'penalty' as 'match_cost' | 'penalty' | 'other' | 'field_cost' | 'referee_cost'
  });

  // State for affected transactions modal
  const [showAffectedTransactions, setShowAffectedTransactions] = useState(false);
  const [affectedTransactionsData, setAffectedTransactionsData] = useState({
    costSettingId: 0,
    costSettingName: '',
    oldAmount: 0,
    newAmount: 0
  });

  const { data: costSettings, isLoading } = useQuery({
    queryKey: withOrgQueryKey(['enhanced-cost-settings'], organizationId),
    queryFn: enhancedCostSettingsService.getCostSettings,
    enabled: open && orgQueryEnabled,
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

    setIsSubmitting(true);
    
    const settingData = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
    };

    let result;
    if (editingItem) {
      result = await enhancedCostSettingsService.updateCostSetting(editingItem.id, settingData);
    } else {
      result = await enhancedCostSettingsService.addCostSetting(settingData);
    }

    setIsSubmitting(false);

    if (result.success) {
      const message = result.affectedTransactions && result.affectedTransactions > 0
        ? `${result.message} ${result.affectedTransactions} transactie(s) zijn automatisch aangepast.`
        : result.message;
      
      toast({
        title: "Succesvol",
        description: message,
        duration: result.affectedTransactions && result.affectedTransactions > 0 ? 5000 : 3000
      });
      
      if (result.affectedTransactions && result.affectedTransactions > 0 && editingItem) {
        setAffectedTransactionsData({
          costSettingId: editingItem.id,
          costSettingName: editingItem.name,
          oldAmount: editingItem.amount,
          newAmount: parseFloat(formData.amount)
        });
        setShowAffectedTransactions(true);
      }
      
      queryClient.invalidateQueries({ queryKey: ['enhanced-cost-settings'] });
      queryClient.invalidateQueries({ queryKey: ['team-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['all-team-transactions'] });
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
      queryClient.invalidateQueries({ queryKey: ['enhanced-cost-settings'] });
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
      amount: item.amount.toString(),
      category: item.category
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
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
      case 'field_cost':
        return 'Veldkosten';
      case 'referee_cost':
        return 'Scheidsrechterkosten';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'match_cost':
        return 'bg-brand-100 text-brand-800 border-brand-200';
      case 'penalty':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'other':
        return 'bg-muted text-card-foreground border-border';
      case 'field_cost':
        return 'bg-brand-50 text-brand-dark border-brand-light';
      case 'referee_cost':
        return 'bg-brand-100 text-brand-800 border-brand-200';
      default:
        return 'bg-muted text-card-foreground border-border';
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
    <>
      <AppModal open={open} onOpenChange={onOpenChange} title="Uitgebreide Kostenbeheer" size="lg">
        <div className="space-y-4">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Automatische updates:</strong> Wanneer je een kostentarief wijzigt, worden alle gerelateerde transacties automatisch aangepast. 
              Dit zorgt ervoor dat alle team balances correct blijven.
            </AlertDescription>
          </Alert>

          {/* Add/Edit Form */}
          {showAddForm && (
            <Card className="border-primary/20 shadow-lg card-hover">
              <CardHeader className="p-4">
                <CardTitle className="text-base font-semibold text-brand-dark">
                  {editingItem ? 'Bewerk Kostentarief' : 'Nieuw Kostentarief'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-brand-dark">Naam *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Bijv. Veldkosten per wedstrijd"
                      className="modal__input"
                      disabled={isSubmitting}
                    />
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
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-brand-dark">Categorie *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: any) => setFormData({...formData, category: value})}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="modal__input min-h-[44px]">
                      <SelectValue />
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
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={handleSave}
                    variant="unstyled"
                    className="btn btn--primary w-full min-h-[44px]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Bezig..." : editingItem ? 'Bijwerken' : 'Toevoegen'}
                  </Button>
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={resetForm}
                    className="btn btn--secondary w-full min-h-[44px]"
                    disabled={isSubmitting}
                  >
                    Annuleren
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            variant="unstyled"
            className="btn btn--secondary flex items-center justify-center gap-2 w-full min-h-[44px]"
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {showAddForm ? "Annuleren" : "Nieuw kostentarief"}
          </Button>

          {/* Settings by Category */}
          {Object.entries(groupedSettings).map(([category, settings]) => (
            <Card key={category} className="border-primary/20 shadow-lg card-hover">
              <CardHeader className="p-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-brand-dark">
                  <Badge className={cn("border", getCategoryColor(category))}>
                    {getCategoryLabel(category)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ul className="space-y-2">
                  {settings.map((setting) => (
                    <li
                      key={setting.id}
                      className="rounded-lg border border-primary/20 bg-card p-3 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col min-w-0 flex-1 gap-1">
                          <p className="text-sm font-medium text-brand-dark truncate">{setting.name}</p>
                        </div>
                        <span className="text-sm font-semibold text-brand-dark tabular-nums whitespace-nowrap shrink-0">
                          {formatCurrency(setting.amount)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => handleEdit(setting)}
                            className="btn btn--icon btn--edit"
                            disabled={isSubmitting}
                            aria-label="Bewerk tarief"
                          >
                            <Edit className="h-4 w-4" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => setDeletingItem(setting)}
                            className="btn btn--icon btn--danger"
                            disabled={isSubmitting}
                            aria-label="Verwijder tarief"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          {isLoading && (
            <div className="text-center py-8 text-muted-foreground" aria-busy="true">
              Kostentarieven laden...
            </div>
          )}
        </div>
      </AppModal>

      <AppAlertModal
        open={!!deletingItem}
        onOpenChange={(openState) => {
          if (!openState) setDeletingItem(null);
        }}
        title="Kostentarief verwijderen"
        description={
          <DestructiveConfirmDescription
            message={
              <>
                Weet je zeker dat je{" "}
                <span className="font-semibold text-destructive">{deletingItem?.name}</span>{" "}
                wilt verwijderen?
              </>
            }
            warning="Deze actie kan niet ongedaan worden gemaakt. Alle gerelateerde transacties zullen beïnvloed worden."
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

      <FinancialAffectedTransactionsModal
        open={showAffectedTransactions}
        onOpenChange={setShowAffectedTransactions}
        costSettingId={affectedTransactionsData.costSettingId}
        costSettingName={affectedTransactionsData.costSettingName}
        oldAmount={affectedTransactionsData.oldAmount}
        newAmount={affectedTransactionsData.newAmount}
      />
    </>
  );
};

