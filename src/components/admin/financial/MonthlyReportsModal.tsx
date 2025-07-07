import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { monthlyReportsService } from "@/services/monthlyReportsService";
import { Calendar, Download, Euro } from "lucide-react";

interface MonthlyReportsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MonthlyReportsModal: React.FC<MonthlyReportsModalProps> = ({ open, onOpenChange }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['monthly-report', selectedYear, selectedMonth],
    queryFn: () => monthlyReportsService.getMonthlyReport(selectedYear, selectedMonth || undefined),
    enabled: open,
    retry: 2,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const { data: yearlyRefereePayments } = useQuery({
    queryKey: ['yearly-referee-payments', selectedYear],
    queryFn: () => monthlyReportsService.getYearlyRefereePayments(selectedYear),
    enabled: open
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maart' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Augustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Maandelijkse Kostenrapportage
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-2 block">Jaar</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Maand (optioneel)</label>
              <Select value={selectedMonth?.toString() || ""} onValueChange={(value) => setSelectedMonth(value ? parseInt(value) : null)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Alle maanden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle maanden</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Summary Cards */}
          {report && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Wedstrijden Gespeeld
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {report.totalMatches}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Totale Veldkosten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(report.totalFieldCosts)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Scheidsrechterkosten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(report.totalRefereeCosts)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Totale Boetes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(report.totalFines)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Scheidsrechter Betalingen */}
          {report && report.refereeCosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scheidsrechter Betalingen</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scheidsrechter</TableHead>
                      <TableHead className="text-center">Aantal Wedstrijden</TableHead>
                      <TableHead className="text-right">Te Betalen Bedrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.refereeCosts.map((referee, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{referee.referee}</TableCell>
                        <TableCell className="text-center">{referee.matchCount}</TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          {formatCurrency(referee.totalCost)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Boetes per Maand */}
          {report?.fines && report.fines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Boetes per Maand</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Maand</TableHead>
                      <TableHead className="text-center">Aantal Boetes</TableHead>
                      <TableHead className="text-right">Totaal Bedrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.fines.map((month, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell className="text-center">{month.fineCount}</TableCell>
                        <TableCell className="text-right font-semibold text-orange-600">
                          {formatCurrency(month.totalFines)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Wedstrijdstatistieken per Maand */}
          {report?.matchStats && report.matchStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Wedstrijden per Maand</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Maand</TableHead>
                      <TableHead className="text-center">Gespeelde Wedstrijden</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.matchStats.map((month, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell className="text-center font-semibold text-blue-600">
                          {month.totalMatches}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Veldkosten per Maand */}
          {report?.fieldCosts && report.fieldCosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Veldkosten per Maand</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Maand</TableHead>
                      <TableHead className="text-center">Aantal Wedstrijden</TableHead>
                      <TableHead className="text-right">Totale Kosten</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.fieldCosts.map((month, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell className="text-center">{month.matchCount}</TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          {formatCurrency(month.totalCost)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Error state */}
          {error && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-red-500 mb-2">Er is een fout opgetreden bij het laden van het rapport.</p>
                <p className="text-sm text-gray-500">{error.message}</p>
              </CardContent>
            </Card>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p>Rapport laden...</p>
              </div>
            </div>
          )}

          {/* Show message when no data */}
          {report && !isLoading && !error && report.totalMatches === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">
                  Geen wedstrijdgegevens gevonden voor {selectedMonth ? months.find(m => m.value === selectedMonth)?.label + ' ' : ''}{selectedYear}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Empty state when no referee costs */}
          {report && !isLoading && !error && report.refereeCosts.length === 0 && report.totalMatches > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scheidsrechter Betalingen</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">
                  Geen scheidsrechterkosten gevonden voor deze periode.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyReportsModal;