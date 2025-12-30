import React, { useState, useEffect } from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { costSettingsService } from "@/services/financial";
import { useToast } from "@/hooks/use-toast";
import { Plus, Euro, TrendingDown, TrendingUp, Trash2, Edit2, ChevronDown, Loader2 } from "lucide-react";
import { formatDateShort, getCurrentDate } from "@/lib/dateUtils";
import { TransactionEditModal } from "./transaction-edit-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
    if (!team) {
      toast({
        title: "Fout",
        description: "Team niet gevonden",
        variant: "destructive"
      });
      return;
    }

    const confirmed = window.confirm(
      `Weet je zeker dat je deze transactie wilt verwijderen?\n\n` +
      `Bedrag: ${formatCurrency(Math.abs(transaction.amount))}\n` +
      `Type: ${transaction.description || transaction.cost_settings?.name || 'Onbekend'}\n\n` +
      `Deze actie kan niet ongedaan gemaakt worden.`
    );
    
    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      console.log('Deleting transaction:', transaction.id);
      const result = await costSettingsService.deleteTransaction(transaction.id);

      if (result.success) {
        toast({
          title: "Succesvol verwijderd",
          description: "De transactie is succesvol verwijderd uit de database."
        });
        // Invalidate queries to refresh the list
        await queryClient.invalidateQueries({ queryKey: ['team-transactions', team.team_id] });
        await queryClient.invalidateQueries({ queryKey: ['team-transactions'] });
      } else {
        toast({
          title: "Fout",
          description: result.message || "Er is een fout opgetreden bij het verwijderen van de transactie",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      toast({
        title: "Fout",
        description: `Er is een fout opgetreden: ${errorMessage}`,
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

  // Group transactions by match_id
  const groupTransactionsByMatch = () => {
    if (!transactions) return [];
    
    const grouped: Array<{
      match_id: number | null;
      match_info?: { 
        unique_number: string; 
        match_date: string;
        home_team_id?: number;
        away_team_id?: number;
        teams_home?: { team_name: string };
        teams_away?: { team_name: string };
      };
      transactions: any[];
      totalAmount: number;
      transaction_date: string;
    }> = [];
    
    const matchGroups = new Map<number | string, any[]>();
    const standaloneTransactions: any[] = [];
    
    // Separate transactions with match_id from those without
    transactions.forEach(transaction => {
      if (transaction.match_id) {
        const key = transaction.match_id;
        if (!matchGroups.has(key)) {
          matchGroups.set(key, []);
        }
        matchGroups.get(key)!.push(transaction);
      } else {
        standaloneTransactions.push(transaction);
      }
    });
    
    // Create grouped entries for matches
    matchGroups.forEach((transactions, matchId) => {
      const firstTransaction = transactions[0];
      const totalAmount = transactions.reduce((sum, t) => {
        const amount = Math.abs(t.amount);
        return t.transaction_type === 'deposit' ? sum + amount : sum - amount;
      }, 0);
      
      grouped.push({
        match_id: typeof matchId === 'number' ? matchId : null,
        match_info: firstTransaction.matches,
        transactions: transactions.sort((a, b) => 
          (a.cost_settings?.name || '').localeCompare(b.cost_settings?.name || '')
        ),
        totalAmount,
        transaction_date: firstTransaction.transaction_date
      });
    });
    
    // Add standalone transactions as individual groups
    standaloneTransactions.forEach(transaction => {
      grouped.push({
        match_id: null,
        transactions: [transaction],
        totalAmount: transaction.transaction_type === 'deposit' 
          ? Math.abs(transaction.amount) 
          : -Math.abs(transaction.amount),
        transaction_date: transaction.transaction_date
      });
    });
    
    // Sort by date (newest first)
    return grouped.sort((a, b) => 
      new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    );
  };

  const groupedTransactions = groupTransactionsByMatch();

  if (!team) return null;

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        title={`${team.team_name} - Financieel Detail`}
        subtitle={`Financieel overzicht en transacties voor ${team.team_name}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Current Balance Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-purple-900 mb-1">Huidig Saldo</h3>
                  <p className="text-sm text-purple-700 truncate">{team.team_name}</p>
                </div>
                <div className={cn(
                  "text-2xl sm:text-3xl font-bold whitespace-nowrap",
                  currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatCurrency(currentBalance)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Transaction Section */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-base font-semibold">Transactie Toevoegen</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto flex items-center justify-center gap-2"
                      disabled={loadingCostSettings || !costSettings || costSettings.length === 0}
                    >
                      {loadingCostSettings ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      <span>{loadingCostSettings ? 'Laden...' : 'Kosten Selecteren'}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end"
                    className="w-[calc(100vw-2rem)] sm:w-80 max-h-96 overflow-y-auto z-[60]"
                  >
                    {loadingCostSettings ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Kosten laden...
                      </div>
                    ) : costSettings && costSettings.length > 0 ? (
                      costSettings.map((cost) => (
                        <DropdownMenuItem
                          key={cost.id}
                          onClick={() => handleCostSelection(cost)}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{cost.name}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {cost.category === 'match_cost' ? 'Wedstrijd' : 
                               cost.category === 'penalty' ? 'Boete' : 
                               cost.category === 'deposit' ? 'Storting' : 'Overig'}
                            </Badge>
                            <span className="font-semibold text-sm whitespace-nowrap">
                              {cost.category === 'deposit' ? 'Handmatig' : formatCurrency(cost.amount)}
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
                <Card className="bg-muted/50 border-2 border-purple-200">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Geselecteerde Kosten</Label>
                      <div className="p-3 bg-card rounded-lg border border-border">
                        <div className="font-medium text-sm mb-1">{selectedCost.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {selectedCost.category === 'match_cost' ? 'Wedstrijd' : 
                           selectedCost.category === 'penalty' ? 'Boete' : 
                           selectedCost.category === 'deposit' ? 'Storting' : 'Overig'}
                        </Badge>
                      </div>
                    </div>

                    {selectedCost.category === 'deposit' && (
                      <div>
                        <Label htmlFor="custom-amount" className="text-sm font-medium mb-2 block">
                          Bedrag (€)
                        </Label>
                        <Input
                          id="custom-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full"
                        />
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={handleAddTransaction}
                        className="flex-1"
                        disabled={isSubmitting || (selectedCost.category === 'deposit' && (!customAmount || parseFloat(customAmount) <= 0))}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Bezig...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Transactie Toevoegen
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddTransaction(false);
                          setSelectedCost(null);
                          setCustomAmount('');
                        }}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-initial"
                      >
                        Annuleren
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-base font-semibold mb-3">Transactie Geschiedenis</h3>
              
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Laden...</span>
                </div>
              ) : groupedTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Geen transacties gevonden</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {groupedTransactions.map((group, groupIndex) => {
                    const isMatchGroup = group.match_id !== null && group.transactions.length > 1;
                    
                    return (
                      <Card 
                        key={group.match_id || `standalone-${group.transactions[0].id}`}
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
                          {/* Compact Match Header */}
                          {isMatchGroup && group.match_info && (() => {
                            // Determine opponent team name
                            const opponentTeam = team && group.match_info.home_team_id && group.match_info.away_team_id
                              ? (group.match_info.home_team_id === team.team_id 
                                  ? group.match_info.teams_away?.team_name 
                                  : group.match_info.teams_home?.team_name)
                              : null;
                            
                            return (
                            <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-border/60">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Badge 
                                  variant="outline" 
                                  className="text-[10px] px-1.5 py-0.5 shrink-0"
                                  style={{ 
                                    backgroundColor: 'var(--accent)', 
                                    color: 'white',
                                    borderColor: 'var(--accent)'
                                  }}
                                >
                                  {opponentTeam || `#${group.match_info.unique_number}`}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground truncate">
                                  {formatDateShort(group.match_info.match_date || group.transaction_date)}
                                </span>
                              </div>
                              <div 
                                className="text-base font-semibold whitespace-nowrap shrink-0"
                                style={{ color: 'var(--accent)' }}
                              >
                                {group.totalAmount >= 0 ? '+' : ''}{formatCurrency(Math.abs(group.totalAmount))}
                              </div>
                            </div>
                            );
                          })()}
                          
                          {/* Compact Transactions List */}
                          <div className="space-y-1">
                            {group.transactions.map((transaction, idx) => (
                              <div 
                                key={transaction.id}
                                className={cn(
                                  "flex items-center justify-between gap-2 py-1",
                                  isMatchGroup && idx < group.transactions.length - 1 && "border-b border-border/30"
                                )}
                              >
                                {/* Left: Type & Description */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="flex flex-col min-w-0 flex-1">
                                    {!isMatchGroup && (
                                      <span className="text-[10px] text-muted-foreground leading-tight">
                                        {formatDateShort(transaction.transaction_date)}
                                      </span>
                                    )}
                                    <p className="text-xs font-medium truncate leading-tight">
                                      {transaction.description || 
                                       transaction.cost_settings?.name || 
                                       transaction.matches?.unique_number || 
                                       '-'}
                                    </p>
                                  </div>
                                </div>

                                {/* Right: Amount & Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <div 
                                    className="text-xs font-semibold whitespace-nowrap"
                                    style={{ color: 'var(--accent)' }}
                                  >
                                    {transaction.transaction_type === 'deposit' ? '+' : '-'}
                                    {formatCurrency(Math.abs(transaction.amount))}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleEditTransaction(transaction)}
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
                                      aria-label="Bewerk transactie"
                                    >
                                      <Edit2 size={14} />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleDeleteTransaction(transaction)}
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
                                      aria-label="Verwijder transactie"
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
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

