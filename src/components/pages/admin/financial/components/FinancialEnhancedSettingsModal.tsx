
import React, { useState } from "react";
import { AppModal, AppModalHeader, AppModalTitle, AppModalFooter } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Edit, Trash2, Plus, AlertTriangle, Info, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { enhancedCostSettingsService } from "@/services/financial";
import FinancialAffectedTransactionsModal from "./FinancialAffectedTransactionsModal";

interface FinancialEnhancedSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FinancialEnhancedSettingsModal: React.FC<FinancialEnhancedSettingsModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
    queryKey: ['enhanced-cost-settings'],
    queryFn: enhancedCostSettingsService.getCostSettings
  });

  const handleSave = async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] EnhancedCostSettingsModal - handleSave START:`, { formData, editingItem });

    if (!formData.name || !formData.amount) {
      console.log(`[${timestamp}] EnhancedCostSettingsModal - Validation failed:`, { 
        hasName: !!formData.name, 
        hasAmount: !!formData.amount 
      });
      toast({
        title: "Fout",
        description: "Vul alle verplichte velden in",
        variant: "destructive"
      });
      return;
    }

    // Check if this is an amount update that will affect existing transactions
    if (editingItem && parseFloat(formData.amount) !== editingItem.amount) {
      const confirm = window.confirm(
        `Let op: Het wijzigen van dit bedrag zal automatisch alle gerelateerde transacties bijwerken. ` +
        `Dit kan invloed hebben op team balances. Weet je zeker dat je wilt doorgaan?`
      );
      if (!confirm) {
        return;
      }
    }

    const settingData = {
      name: formData.name,
      description: formData.description || null,
      amount: parseFloat(formData.amount),
      category: formData.category,
      is_active: true
    };

    console.log(`[${timestamp}] EnhancedCostSettingsModal - Prepared data:`, { settingData });

    let result;
    if (editingItem) {
      result = await enhancedCostSettingsService.updateCostSetting(editingItem.id, settingData);
    } else {
      result = await enhancedCostSettingsService.addCostSetting(settingData);
    }

    console.log(`[${timestamp}] EnhancedCostSettingsModal - Operation result:`, { result, isEdit: !!editingItem });

    if (result.success) {
      // Show enhanced feedback for automatic transaction updates
      const message = result.affectedTransactions && result.affectedTransactions > 0
        ? `${result.message} ${result.affectedTransactions} transactie(s) zijn automatisch aangepast.`
        : result.message;
      
      toast({
        title: "Succesvol",
        description: message,
        duration: result.affectedTransactions && result.affectedTransactions > 0 ? 5000 : 3000 // Longer duration for important updates
      });
      
      // If there are affected transactions, show the modal
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

  const handleDelete = async (id: number) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] EnhancedCostSettingsModal - handleDelete START:`, { id });

    const result = await enhancedCostSettingsService.deleteCostSetting(id);
    
    console.log(`[${timestamp}] EnhancedCostSettingsModal - Delete result:`, { result, id });

    if (result.success) {
      toast({
        title: "Succesvol",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['enhanced-cost-settings'] });
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
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'penalty':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'other':
        return 'bg-muted text-card-foreground';
      case 'field_cost':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'referee_cost':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-muted text-card-foreground';
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
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        size="lg"
        className="max-w-4xl"
      >
        <AppModalHeader>
          <AppModalTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Uitgebreide Kostenbeheer
          </AppModalTitle>
          <p className="app-modal-subtitle sr-only">
            Beheer alle kostentarieven en boetes. Wijzigingen worden automatisch toegepast op alle gerelateerde transacties.
          </p>
        </AppModalHeader>
        <div className="space-y-6">
            {/* Database Health Warning */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Database Probleem:</strong> Er is een probleem met de audit log tabel. 
                Als je foutmeldingen krijgt bij het bijwerken van tarieven, voer dan de database migratie uit zoals beschreven in FIX_AUDIT_LOG_ISSUE.md
              </AlertDescription>
            </Alert>

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
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingItem ? 'Bewerk Kostentarief' : 'Nieuw Kostentarief'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Naam</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Bijv. Veldkosten per wedstrijd"
                        className="modal__input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Bedrag (€)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        className="modal__input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Beschrijving</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optionele beschrijving..."
                      className="modal__input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categorie</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value: any) => setFormData({...formData, category: value})}
                    >
                      <SelectTrigger className="modal__input">
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
                  <AppModalFooter>
                    <button onClick={handleSave} className="btn btn--primary">
                      {editingItem ? 'Bijwerken' : 'Toevoegen'}
                    </button>
                    <button onClick={resetForm} className="btn btn--secondary">
                      Annuleren
                    </button>
                  </AppModalFooter>
                </CardContent>
              </Card>
            )}

            {/* Settings by Category */}
            {Object.entries(groupedSettings).map(([category, settings]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={getCategoryColor(category)}>
                      {getCategoryLabel(category)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table className="table min-w-full">
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
                            <TableCell className="text-card-foreground">
                              {setting.description || '-'}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(setting.amount)}
                            </TableCell>
                            <TableCell className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleEdit(setting)}
                                className="btn btn--outline"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDelete(setting.id)}
                                className="btn btn--danger"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}

            {isLoading && (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Kostentarieven laden...</p>
              </div>
            )}
          </div>
      </AppModal>

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

export default FinancialEnhancedSettingsModal;
