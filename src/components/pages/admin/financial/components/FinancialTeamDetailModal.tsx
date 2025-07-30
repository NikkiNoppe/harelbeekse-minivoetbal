import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { costSettingsService } from "@/services/financial";
import { useToast } from "@/hooks/use-toast";
import { Plus, Euro, TrendingDown, TrendingUp, Trash2, Edit2, Check, X } from "lucide-react";
import { formatDateShort, getCurrentDate } from "@/lib/dateUtils";

interface Team {
  team_id: number;
  team_name: string;
}

interface FinancialTeamDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

const FinancialTeamDetailModal: React.FC<FinancialTeamDetailModalProps> = ({ open, onOpenChange, team }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    amount: '',
    description: '',
    transaction_date: '',
    cost_setting_id: ''
  });
  const [transactionForm, setTransactionForm] = useState({
    type: 'deposit' as 'deposit' | 'penalty' | 'adjustment',
    amount: '',
    description: '',
    cost_setting_id: '',
    transaction_date: getCurrentDate()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['team-transactions', team?.team_id],
    queryFn: () => team ? costSettingsService.getTeamTransactions(team.team_id) : Promise.resolve([]),
    enabled: !!team
  });

  const { data: costSettings } = useQuery({
    queryKey: ['cost-settings'],
    queryFn: costSettingsService.getCostSettings
  });

  // Calculate financial breakdown
  const calculateFinancialBreakdown = () => {
    if (!transactions) return {
      startCapital: 0,
      fieldCosts: 0,
      refereeCosts: 0,
      penalties: 0,
      otherCosts: 0,
      adjustments: 0,
      currentBalance: 0
    };

    const startCapital = transactions
      .filter(t => t.transaction_type === 'deposit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const fieldCosts = transactions
      .filter(t => t.transaction_type === 'match_cost' && 
        (t.cost_settings?.name?.toLowerCase().includes('veld') || 
         t.description?.toLowerCase().includes('veld')))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const refereeCosts = transactions
      .filter(t => t.transaction_type === 'match_cost' && 
        (t.cost_settings?.name?.toLowerCase().includes('scheids') || 
         t.description?.toLowerCase().includes('scheids')))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const penalties = transactions
      .filter(t => t.transaction_type === 'penalty')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const otherCosts = transactions
      .filter(t => t.transaction_type === 'match_cost' && 
        !t.cost_settings?.name?.toLowerCase().includes('veld') &&
        !t.cost_settings?.name?.toLowerCase().includes('scheids'))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const adjustments = transactions
      .filter(t => t.transaction_type === 'adjustment')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Huidig saldo: startkapitaal - alle kosten + correcties
    const currentBalance = startCapital - fieldCosts - refereeCosts - penalties + adjustments;

    return {
      startCapital,
      fieldCosts,
      refereeCosts,
      penalties,
      otherCosts,
      adjustments,
      currentBalance
    };
  };

  const financialBreakdown = calculateFinancialBreakdown();

  const resetTransactionForm = () => {
    setTransactionForm({
      type: 'deposit' as 'deposit' | 'penalty' | 'adjustment',
      amount: '',
      description: '',
      cost_setting_id: '',
      transaction_date: getCurrentDate()
    });
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setShowAddTransaction(false);
      setEditingTransaction(null);
      resetTransactionForm();
    }
  }, [open]);

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!team) return;

    const result = await costSettingsService.deleteTransaction(transactionId);

    if (result.success) {
      toast({
        title: "Succesvol",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['team-transactions', team.team_id] });
      queryClient.invalidateQueries({ queryKey: ['teams-financial'] });
    } else {
      toast({
        title: "Fout",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction.id);
    setEditForm({
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      transaction_date: transaction.transaction_date,
      cost_setting_id: transaction.cost_setting_id?.toString() || ''
    });
  };

  const handleUpdateTransaction = async () => {
    if (!team || !editingTransaction) return;

    const result = await costSettingsService.updateTransaction(editingTransaction, {
      amount: parseFloat(editForm.amount),
      description: editForm.description || null,
      transaction_date: editForm.transaction_date,
      cost_setting_id: editForm.cost_setting_id ? parseInt(editForm.cost_setting_id) : null
    });

    if (result.success) {
      toast({
        title: "Succesvol",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['team-transactions', team.team_id] });
      queryClient.invalidateQueries({ queryKey: ['teams-financial'] });
      setEditingTransaction(null);
      setEditForm({
        amount: '',
        description: '',
        transaction_date: '',
        cost_setting_id: ''
      });
    } else {
      toast({
        title: "Fout",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setEditForm({
      amount: '',
      description: '',
      transaction_date: '',
      cost_setting_id: ''
    });
  };

  const handleAddTransaction = async () => {
    if (!team) {
      toast({
        title: "Fout",
        description: "Team niet gevonden",
        variant: "destructive"
      });
      return;
    }

    if (!transactionForm.amount || parseFloat(transactionForm.amount) <= 0) {
      toast({
        title: "Fout",
        description: "Vul een geldig bedrag in",
        variant: "destructive"
      });
      return;
    }

    if (!transactionForm.transaction_date) {
      toast({
        title: "Fout",
        description: "Vul een datum in",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting transaction:', transactionForm);
      
      const result = await costSettingsService.addTransaction({
        team_id: team.team_id,
        transaction_type: transactionForm.type,
        amount: parseFloat(transactionForm.amount),
        description: transactionForm.description || null,
        cost_setting_id: transactionForm.cost_setting_id ? parseInt(transactionForm.cost_setting_id) : null,
        penalty_type_id: null,
        match_id: null,
        transaction_date: transactionForm.transaction_date
      });

      if (result.success) {
        toast({
          title: "Succesvol",
          description: result.message
        });
        queryClient.invalidateQueries({ queryKey: ['team-transactions', team.team_id] });
        queryClient.invalidateQueries({ queryKey: ['teams-financial'] });
        setShowAddTransaction(false);
        resetTransactionForm();
      } else {
        toast({
          title: "Fout",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de transactie",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'penalty':
      case 'match_cost':
      case 'adjustment':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Euro className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-100 text-green-800';
      case 'penalty':
        return 'bg-red-100 text-red-800';
      case 'match_cost':
        return 'bg-blue-100 text-blue-800';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Storting';
      case 'penalty':
        return 'Boete';
      case 'match_cost':
        return 'Wedstrijdkosten';
      case 'adjustment':
        return 'Correctie';
      default:
        return type;
    }
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="modal__title flex items-center gap-2">
            <Euro className="h-5 w-5" />
            {team.team_name} - Financieel Detail
          </DialogTitle>
          <DialogDescription className="sr-only">
            Financieel overzicht en transacties voor {team.team_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Balance Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Huidig Saldo</h3>
                <p className="text-sm text-gray-600">Team: {team.team_name}</p>
              </div>
              <div className={`text-2xl font-bold ${financialBreakdown.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(financialBreakdown.currentBalance)}
              </div>
            </div>
          </div>

          {/* Add Transaction Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Transacties</h3>
              <Button 
                onClick={() => setShowAddTransaction(!showAddTransaction)}
                className="btn btn--secondary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nieuwe Transactie
              </Button>
            </div>

            {showAddTransaction && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Type Transactie</Label>
                    <Select 
                      value={transactionForm.type} 
                      onValueChange={(value: any) => setTransactionForm({...transactionForm, type: value})}
                    >
                      <SelectTrigger className="modal__input">
                        <SelectValue placeholder="Selecteer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">Storting</SelectItem>
                        <SelectItem value="penalty">Boete</SelectItem>
                        <SelectItem value="adjustment">Correctie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Bedrag (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                      placeholder="0.00"
                      className="modal__input"
                    />
                    {transactionForm.cost_setting_id && (
                      <p className="text-xs text-gray-500 mt-1">
                        Bedrag kan aangepast worden indien nodig
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Datum</Label>
                    <Input
                      type="date"
                      value={transactionForm.transaction_date}
                      onChange={(e) => setTransactionForm({...transactionForm, transaction_date: e.target.value})}
                      className="modal__input"
                    />
                  </div>

                  {(transactionForm.type === 'penalty') && (
                    <div>
                      <Label>Boete Type</Label>
                      <Select 
                        value={transactionForm.cost_setting_id} 
                        onValueChange={(value) => {
                          const selectedCostSetting = costSettings?.find(cs => cs.id.toString() === value);
                          setTransactionForm({
                            ...transactionForm, 
                            cost_setting_id: value,
                            amount: selectedCostSetting ? selectedCostSetting.amount.toString() : transactionForm.amount
                          });
                        }}
                      >
                        <SelectTrigger className="modal__input">
                          <SelectValue placeholder="Selecteer boete type" />
                        </SelectTrigger>
                        <SelectContent>
                          {costSettings?.filter(cs => cs.category === 'penalty').map(cs => (
                            <SelectItem key={cs.id} value={cs.id.toString()}>
                              {cs.name} - {formatCurrency(cs.amount)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <Label>Beschrijving</Label>
                    <Textarea
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                      placeholder="Optionele beschrijving..."
                      rows={2}
                      className="modal__input"
                    />
                  </div>
                </div>

                <div className="modal__actions mt-4">
                  <Button 
                    onClick={handleAddTransaction} 
                    className="btn btn--primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Bezig...' : 'Transactie Toevoegen'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowAddTransaction(false);
                      resetTransactionForm();
                    }}
                    className="btn btn--secondary"
                    disabled={isSubmitting}
                  >
                    Annuleren
                  </Button>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <Table className="table min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32 lg:w-40">Datum</TableHead>
                    <TableHead className="w-32 lg:w-40">Type</TableHead>
                    <TableHead className="min-w-48 lg:min-w-64">Beschrijving</TableHead>
                    <TableHead className="text-right w-32 lg:w-40">Bedrag</TableHead>
                    <TableHead className="text-center w-24 lg:w-32">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTransactions ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Laden...</TableCell>
                    </TableRow>
                  ) : transactions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        Geen transacties gevonden
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        {editingTransaction === transaction.id ? (
                          // Edit Mode
                          <>
                            <TableCell>
                              <Input
                                type="date"
                                value={editForm.transaction_date}
                                onChange={(e) => setEditForm({...editForm, transaction_date: e.target.value})}
                                className="modal__input w-full"
                              />
                            </TableCell>
                            <TableCell>
                              <Badge className={getTransactionColor(transaction.transaction_type)}>
                                <div className="flex items-center gap-1">
                                  {getTransactionIcon(transaction.transaction_type)}
                                  {getTransactionLabel(transaction.transaction_type)}
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editForm.description}
                                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                placeholder="Beschrijving"
                                className="modal__input w-full"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.amount}
                                onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                                className="modal__input w-full text-right"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="sm"
                                  onClick={handleUpdateTransaction}
                                  className="btn btn--primary"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="btn btn--secondary"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          // View Mode
                          <>
                            <TableCell>
                              {formatDateShort(transaction.transaction_date)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getTransactionColor(transaction.transaction_type)}>
                                <div className="flex items-center gap-1">
                                  {getTransactionIcon(transaction.transaction_type)}
                                  {getTransactionLabel(transaction.transaction_type)}
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {transaction.description || 
                               transaction.cost_settings?.name || 
                               transaction.matches?.unique_number || 
                               '-'}
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${
                              transaction.transaction_type === 'deposit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.transaction_type === 'deposit' ? '+' : '-'}
                              {formatCurrency(Math.abs(transaction.amount))}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditTransaction(transaction)}
                                  className="btn btn--outline"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                  className="btn btn--danger"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialTeamDetailModal;
