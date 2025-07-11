import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { enhancedCostSettingsService, type TeamTransaction } from "@/services/financial";

interface AffectedTransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costSettingId: number;
  costSettingName: string;
  oldAmount: number;
  newAmount: number;
}

const AffectedTransactionsModal: React.FC<AffectedTransactionsModalProps> = ({
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
  }, [open, costSettingId]);

  const loadAffectedTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await enhancedCostSettingsService.getAffectedTransactions(costSettingId);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading affected transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'match_cost':
        return 'Wedstrijdkosten';
      case 'penalty':
        return 'Boete';
      case 'deposit':
        return 'Storting';
      case 'adjustment':
        return 'Aanpassing';
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'match_cost':
        return 'bg-blue-100 text-blue-800';
      case 'penalty':
        return 'bg-red-100 text-red-800';
      case 'deposit':
        return 'bg-green-100 text-green-800';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalImpact = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const amountDifference = newAmount - oldAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Getroffen Transacties
          </DialogTitle>
          <DialogDescription>
            Overzicht van transacties die automatisch zijn aangepast na wijziging van "{costSettingName}"
          </DialogDescription>
        </DialogHeader>

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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Laden van getroffen transacties...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
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
            <div className="text-center py-8 text-gray-500">
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
      </DialogContent>
    </Dialog>
  );
};

export default AffectedTransactionsModal; 