import React, { useState, useCallback, useMemo } from "react";
import { AppModal, AppModalHeader, AppModalTitle } from "@/components/modals/base/app-modal";
import { AppAlertModal } from "@/components/modals/base/app-alert-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { enhancedCostSettingsService } from "@/services/financial";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Edit, Trash2, Euro, X } from "lucide-react";

interface FinancialSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FinancialSettingsModal: React.FC<FinancialSettingsModalProps> = ({ 
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
      case 'deposit': return 'Storting';
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
      case 'deposit': return '!bg-green-50 !text-green-700 !border-green-200 hover:!bg-green-100 hover:!border-green-300';
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
        <AppModalHeader
          style={{
            marginTop: '0px',
            marginBottom: '0px',
            backgroundColor: 'unset',
            background: 'unset',
            position: 'relative',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <h2
              className="flex items-center gap-2"
              style={{
                marginTop: '0px',
                marginBottom: '0px',
                backgroundColor: 'unset',
                background: 'unset',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--color-700)'
              }}
            >
              <Euro className="h-5 w-5" />
              Kostenlijst Beheer
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                borderRadius: '50%',
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 150ms',
                flexShrink: 0
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
              }}
              aria-label="Sluiten"
            >
              <X size={16} />
            </button>
          </div>
        </AppModalHeader>
        <div className="space-y-4">
          {/* Form Section */}
          <Card className="border transition-all duration-150 hover:shadow-sm" style={{ borderColor: 'var(--accent)', borderWidth: '1px', borderStyle: 'solid' }}>
            {showAddForm && (
              <CardContent 
                className="!bg-transparent"
                style={{ 
                  paddingTop: '12px', 
                  paddingBottom: '12px', 
                  paddingLeft: '12px', 
                  paddingRight: '12px',
                  backgroundColor: 'unset',
                  background: 'unset'
                }}
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Naam *</Label>
                    <Input
                      value={formData.name}
                      onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      placeholder="Naam van het tarief"
                      className="modal__input"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Categorie *</Label>
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

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Bedrag (€) *</Label>
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

                  <div className="flex flex-col gap-2 pt-2">
                    <button 
                      onClick={handleSave}
                      className="btn btn--primary w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Bezig...' : (editingItem ? 'Bijwerken' : 'Toevoegen')}
                    </button>
                    <button 
                      onClick={resetForm}
                      className="btn btn--secondary w-full"
                      disabled={isSubmitting}
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
          
          {/* Nieuw Tarief Button */}
          <button 
            onClick={() => showAddForm ? resetForm() : setShowAddForm(true)}
            className="btn btn--secondary flex items-center justify-center gap-2 w-full"
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4" />
            {showAddForm ? 'Annuleren' : 'Nieuw Tarief'}
          </button>

          {/* Settings List */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Huidige Tarieven
                {costSettings && (
                  <Badge variant="secondary" className="text-xs">
                    {costSettings.length} items
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tarieven laden...
                </div>
              ) : costSettings && costSettings.length > 0 ? (
                <div className="space-y-1.5">
                  {costSettings.map((setting) => (
                    <Card 
                      key={setting.id}
                      className="border transition-all duration-150 hover:shadow-sm"
                      style={{
                        borderColor: 'var(--accent)',
                        borderWidth: '1px',
                        borderStyle: 'solid'
                      }}
                    >
                      <CardContent 
                        className="!bg-transparent"
                        style={{ 
                          paddingTop: '12px', 
                          paddingBottom: '12px', 
                          paddingLeft: '12px', 
                          paddingRight: '12px',
                          backgroundColor: 'unset',
                          background: 'unset'
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex flex-col min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {setting.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getCategoryColor(setting.category)}>
                                  {getCategoryLabel(setting.category)}
                                </Badge>
                                <span 
                                  className="text-xs font-semibold whitespace-nowrap"
                                  style={{ color: 'var(--accent)' }}
                                >
                                  {formatCurrency(setting.amount)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(setting)}
                              className={cn(
                                "h-7 w-7 border-[var(--color-300)]",
                                "bg-white hover:bg-purple-50 hover:border-[var(--color-400)]",
                                "text-[var(--color-700)] hover:text-[var(--color-900)]",
                                "transition-colors duration-150"
                              )}
                              style={{ 
                                height: '28px',
                                width: '28px',
                                minHeight: '28px',
                                maxHeight: '28px',
                                minWidth: '28px',
                                maxWidth: '28px'
                              }}
                              disabled={isSubmitting}
                              aria-label="Bewerk tarief"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setDeletingItem(setting)}
                              className={cn(
                                "!h-7 !w-7 !min-h-0 !max-h-7 !max-w-7 rounded-md border-red-300",
                                "hover:bg-red-50 hover:border-red-400",
                                "text-red-600 hover:text-red-700",
                                "transition-colors duration-150"
                              )}
                              style={{ 
                                height: '28px',
                                width: '28px',
                                minHeight: '28px',
                                maxHeight: '28px',
                                minWidth: '28px',
                                maxWidth: '28px'
                              }}
                              disabled={isSubmitting}
                              aria-label="Verwijder tarief"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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

