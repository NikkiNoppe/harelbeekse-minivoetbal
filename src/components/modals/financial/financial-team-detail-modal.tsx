import React, { useState, useEffect } from "react";
import { AppModal, AppModalHeader, AppModalTitle } from "@/components/modals/base/app-modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { costSettingsService } from "@/services/financial";
import { useToast } from "@/hooks/use-toast";
import { Plus, Euro, TrendingDown, TrendingUp, Trash2, Edit2, ChevronDown } from "lucide-react";
import { formatDateShort, getCurrentDate } from "@/lib/dateUtils";
import { TransactionEditModal } from "./transaction-edit-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Team {
  team_id: number;
  team_name: string;
}

interface FinancialTeamDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

export const FinancialTeamDetailModal: React.FC<FinancialTeamDetailModalProps> = ({ open, onOpenChange, team }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for transaction actions
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedCost, setSelectedCost] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Fetch data
  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['team-transactions', team?.team_id],
    queryFn: () => team ? costSettingsService.getTeamTransactions(team.team_id) : Promise.resolve([]),
    enabled: !!team && open
  });

  const { data: costSettings, isLoading: loadingCostSettings } = useQuery({
    queryKey: ['cost-settings'],
    queryFn: costSettingsService.getCostSettings,
    enabled: open
  });

  // Calculate current balance
  const calculateCurrentBalance = () => {
    if (!transactions) return 0;
    
    return transactions.reduce((balance, transaction) => {
      const amount = Math.abs(transaction.amount);
      if (transaction.transaction_type === 'deposit') {
        return balance + amount;
      } else {
        return balance - amount;
      }
    }, 0);
  };

  const currentBalance = calculateCurrentBalance();

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setShowAddTransaction(false);
      setSelectedCost(null);
      setCustomAmount('');
      setEditModalOpen(false);
      setSelectedTransaction(null);
    }
  }, [open]);

  // Handle cost selection from dropdown
  const handleCostSelection = (cost: any) => {
    setSelectedCost(cost);
    setCustomAmount('');
    setShowAddTransaction(true);
  };

  // Handle transaction submission
  const handleAddTransaction = async () => {
    if (!team || !selectedCost) {
      toast({
        title: "Fout",
        description: "Team of kosten niet gevonden",
        variant: "destructive"
      });
      return;
    }

    let amount = selectedCost.amount;
    let description = selectedCost.name;

    // For deposits, use custom amount if provided
    if (selectedCost.category === 'deposit') {
      if (!customAmount || parseFloat(customAmount) <= 0) {
        toast({
          title: "Fout",
          description: "Vul een geldig bedrag in voor de storting",
          variant: "destructive"
        });
        return;
      }
      amount = parseFloat(customAmount);
      description = `Storting: €${amount.toFixed(2)}`;
    }

    setIsSubmitting(true);

    try {
      console.log('Adding transaction:', {
        team_id: team.team_id,
        transaction_type: selectedCost.category,
        amount: amount,
        description: description,
        cost_setting_id: selectedCost.id
      });

      const result = await costSettingsService.addTransaction({
        team_id: team.team_id,
        transaction_type: selectedCost.category as 'deposit' | 'penalty' | 'match_cost' | 'adjustment',
        amount: amount,
        description: description,
        cost_setting_id: selectedCost.id,
        penalty_type_id: null,
        match_id: null,
        transaction_date: getCurrentDate()
      });

      console.log('Transaction result:', result);

      if (result.success) {
        toast({
          title: "Succes",
          description: `${description} toegevoegd voor ${team.team_name}`,
        });
        
        // Reset form and refresh data
        setShowAddTransaction(false);
        setSelectedCost(null);
        setCustomAmount('');
        
        // Subtiel: 1 invalidatie + refetch enkel actieve queries voor dit team
        await queryClient.invalidateQueries({ queryKey: ['team-transactions'] });
        await queryClient.refetchQueries({ queryKey: ['team-transactions'], type: 'active' });
      } else {
        console.error('Transaction failed:', result.message);
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

  // Handle edit transaction
  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (transaction: any) => {
    if (!team) return;

    const confirmed = window.confirm("Weet je zeker dat je deze transactie wilt verwijderen?");
    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      const result = await costSettingsService.deleteTransaction(transaction.id);

      if (result.success) {
        toast({
          title: "Succes",
          description: result.message
        });
        queryClient.invalidateQueries({ queryKey: ['team-transactions', team.team_id] });
      } else {
        toast({
          title: "Fout",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de transactie",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="h-4 w-4" />;
      case 'penalty':
        return <TrendingDown className="h-4 w-4" />;
      case 'match_cost':
        return <Euro className="h-4 w-4" />;
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
        return 'bg-muted text-card-foreground';
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
            {team?.team_name} - Financieel Detail
          </AppModalTitle>
          <p className="app-modal-subtitle sr-only">
            Financieel overzicht en transacties voor {team?.team_name}
          </p>
        </AppModalHeader>
        <div className="space-y-6">
            {/* 1. Current Balance */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Huidig Saldo</h3>
                  <p className="text-sm text-card-foreground">Team: {team.team_name}</p>
                </div>
                <div className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(currentBalance)}
                </div>
              </div>
            </div>

            {/* 2. Action with Dropdown */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Transactie Toevoegen</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="btn btn--secondary flex items-center gap-2"
                      disabled={loadingCostSettings || !costSettings || costSettings.length === 0}
                    >
                      <Plus className="h-4 w-4" />
                      {loadingCostSettings ? 'Laden...' : 'Kosten Selecteren'}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto z-[60] bg-card border border-border shadow-xl" style={{ backgroundColor: 'white' }}>
                    {loadingCostSettings ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Kosten laden...
                      </div>
                    ) : costSettings && costSettings.length > 0 ? (
                      costSettings.map((cost) => (
                        <DropdownMenuItem
                          key={cost.id}
                          onClick={() => handleCostSelection(cost)}
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{cost.name}</div>
                            <div className="text-sm text-muted-foreground">{cost.description}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {cost.category === 'match_cost' ? 'Wedstrijd' : 
                               cost.category === 'penalty' ? 'Boete' : 
                               cost.category === 'deposit' ? 'Storting' : 'Overig'}
                            </Badge>
                            <span className="font-semibold text-green-600">
                              {cost.category === 'deposit' ? 'Handmatig' : `€${cost.amount}`}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        Geen kosten gevonden
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Transaction Form */}
              {showAddTransaction && selectedCost && (
                <div className="bg-muted rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Geselecteerde Kosten</Label>
                      <div className="p-3 bg-white rounded border">
                        <div className="font-medium">{selectedCost.name}</div>
                        <div className="text-sm text-muted-foreground">{selectedCost.description}</div>
                        <div className="text-sm text-card-foreground mt-1">
                          Categorie: {selectedCost.category === 'match_cost' ? 'Wedstrijd' : 
                                     selectedCost.category === 'penalty' ? 'Boete' : 
                                     selectedCost.category === 'deposit' ? 'Storting' : 'Overig'}
                        </div>
                      </div>
                    </div>

                    {selectedCost.category === 'deposit' && (
                      <div>
                        <Label htmlFor="custom-amount">Bedrag (€)</Label>
                        <Input
                          id="custom-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Voer bedrag in..."
                          className="modal__input"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button 
                        onClick={handleAddTransaction}
                        className="btn btn--primary"
                        disabled={isSubmitting || (selectedCost.category === 'deposit' && (!customAmount || parseFloat(customAmount) <= 0))}
                      >
                        {isSubmitting ? 'Bezig...' : 'Transactie Toevoegen'}
                      </button>
                      <button 
                        onClick={() => {
                          setShowAddTransaction(false);
                          setSelectedCost(null);
                          setCustomAmount('');
                        }}
                        className="btn btn--secondary"
                        disabled={isSubmitting}
                      >
                        Annuleren
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Transaction History */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Transactie Geschiedenis</h3>
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
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Geen transacties gevonden
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions?.map((transaction) => (
                        <TableRow key={transaction.id}>
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
                                className="btn btn--icon btn--edit"
                                disabled={isSubmitting}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDeleteTransaction(transaction)}
                                className="btn btn--outline text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
      </AppModal>

      <TransactionEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        transaction={selectedTransaction}
        teamId={team?.team_id || 0}
      />
    </>
  );
};

