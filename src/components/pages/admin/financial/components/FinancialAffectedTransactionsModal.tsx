import React, { useCallback, useMemo } from "react";
import { AppModal, AppModalHeader, AppModalTitle } from "@/components/ui/app-modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { enhancedCostSettingsService, type TeamTransaction } from "@/services/financial";

interface FinancialAffectedTransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costSettingId: number;
  costSettingName: string;
  oldAmount: number;
  newAmount: number;
}

const FinancialAffectedTransactionsModal: React.FC<FinancialAffectedTransactionsModalProps> = ({
  open,
  onOpenChange,
  costSettingId,
  costSettingName,
  oldAmount,
  newAmount
}) => {
  const [transactions, setTransactions] = React.useState<TeamTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && costSettingId) {
      loadAffectedTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, costSettingId]);

  const loadAffectedTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await enhancedCostSettingsService.getAffectedTransactions(costSettingId);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading affected transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [costSettingId]);

  const formatCurrency = useMemo(() => (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }, []);

  const formatDate = useMemo(() => (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  }, []);

  const getTransactionTypeLabel = useMemo(() => (type: string) => {
    switch (type) {
      case 'match_cost': return 'Wedstrijdkosten';
      case 'penalty': return 'Boete';
      case 'deposit': return 'Storting';
      case 'adjustment': return 'Aanpassing';
      default: return type;
    }
  }, []);

  const getTransactionTypeColor = useMemo(() => (type: string) => {
    switch (type) {
      case 'match_cost': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'penalty': return 'bg-red-50 text-red-700 border-red-200';
      case 'deposit': return 'bg-green-50 text-green-700 border-green-200';
      case 'adjustment': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-muted text-card-foreground';
    }
  }, []);

  const totalImpact = useMemo(() => transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0), [transactions]);
  const amountDifference = newAmount - oldAmount;

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      className="max-w-3xl"
    >
      <AppModalHeader>
        <AppModalTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Getroffen Transacties
        </AppModalTitle>
        <p className="app-modal-subtitle sr-only">
          Overzicht van transacties die automatisch zijn aangepast na wijziging van "{costSettingName}"
        </p>
      </AppModalHeader>
      <div className="space-y-4">
          {/* Summary Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Wijziging:</strong> {formatCurrency(oldAmount)} → {formatCurrency(newAmount)}
              ({amountDifference > 0 ? '+' : ''}{formatCurrency(amountDifference)})
              <br />
              <strong>Getroffen transacties:</strong> {transactions.length}
              <br />
              <strong>Totaal impact:</strong> {formatCurrency(totalImpact)}
            </AlertDescription>
          </Alert>

          {/* Transactions Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" aria-hidden="true"></div>
              <p className="mt-2 text-sm text-muted-foreground">Laden van getroffen transacties...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table className="table min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Oud Bedrag</TableHead>
                    <TableHead>Nieuw Bedrag</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Beschrijving</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        Team {transaction.team_id}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                          {getTransactionTypeLabel(transaction.transaction_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-red-600">
                        {formatCurrency(oldAmount)}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(newAmount)}
                      </TableCell>
                      <TableCell>
                        {formatDate(transaction.transaction_date)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description || 'Geen beschrijving'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>Geen getroffen transacties gevonden</p>
            </div>
          )}

          {/* Warning about balance impact */}
          {transactions.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Let op:</strong> Deze wijzigingen hebben invloed op de team balances.
                Alle getroffen teams hebben automatisch een aangepaste balans gekregen.
              </AlertDescription>
            </Alert>
          )}
        </div>
    </AppModal>
  );
};

export default FinancialAffectedTransactionsModal; 