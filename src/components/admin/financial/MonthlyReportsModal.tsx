import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
    queryFn: async () => {
      console.log('Fetching monthly report for:', { selectedYear, selectedMonth });
      try {
        const result = await monthlyReportsService.getMonthlyReport(selectedYear, selectedMonth || undefined);
        console.log('Monthly report data:', result);
        return result;
      } catch (err) {
        console.error('Error fetching monthly report:', err);
        throw err;
      }
    },
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
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-white text-foreground border-purple-light">
        <DialogHeader className="bg-purple-100 py-4 -m-4 sm:-m-6 mb-4 sm:mb-6 px-4 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-purple-light">
            <Calendar className="h-5 w-5" />
            Maandelijkse Kostenrapportage
          </DialogTitle>
          <DialogDescription className="text-purple-dark">
            Bekijk maandelijkse kosten, scheidsrechterbetalingen en boetes voor teams
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 bg-white p-4">
          {/* Filters */}
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-2 block text-purple-dark">Jaar</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32 dropdown-login-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dropdown-content-login-style">
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()} className="dropdown-item-login-style">{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-purple-dark">Maand (optioneel)</label>
              <Select value={selectedMonth?.toString() || "all"} onValueChange={(value) => setSelectedMonth(value === "all" ? null : parseInt(value))}>
                <SelectTrigger className="w-40 dropdown-login-style">
                  <SelectValue placeholder="Alle maanden" />
                </SelectTrigger>
                <SelectContent className="dropdown-content-login-style">
                  <SelectItem value="all" className="dropdown-item-login-style">Alle maanden</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()} className="dropdown-item-login-style">
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="btn-light flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Summary Cards */}
          {report && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-purple-light">
                <CardHeader className="bg-purple-100">
                  <CardTitle className="text-sm flex items-center gap-2 text-purple-light">
                    <Euro className="h-4 w-4" />
                    Wedstrijden Gespeeld
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white">
                  <div className="text-2xl font-bold text-purple-dark">
                    {report.totalMatches}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-light">
                <CardHeader className="bg-purple-100">
                  <CardTitle className="text-sm flex items-center gap-2 text-purple-light">
                    <Euro className="h-4 w-4" />
                    Totale Veldkosten
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white">
                  <div className="text-2xl font-bold text-purple-dark">
                    {formatCurrency(report.totalFieldCosts)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-light">
                <CardHeader className="bg-purple-100">
                  <CardTitle className="text-sm flex items-center gap-2 text-purple-light">
                    <Euro className="h-4 w-4" />
                    Scheidsrechterkosten
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white">
                  <div className="text-2xl font-bold text-purple-dark">
                    {formatCurrency(report.totalRefereeCosts)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-light">
                <CardHeader className="bg-purple-100">
                  <CardTitle className="text-sm flex items-center gap-2 text-purple-light">
                    <Euro className="h-4 w-4" />
                    Totale Boetes
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white">
                  <div className="text-2xl font-bold text-purple-dark">
                    {formatCurrency(report.totalFines)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Scheidsrechter Betalingen */}
          {report && report.refereeCosts.length > 0 && (
            <Card className="border-purple-light">
              <CardHeader className="bg-purple-100">
                <CardTitle className="text-purple-light">Scheidsrechter Betalingen</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-purple-100">
                      <TableHead className="text-purple-dark">Scheidsrechter</TableHead>
                      <TableHead className="text-center text-purple-dark">Aantal Wedstrijden</TableHead>
                      <TableHead className="text-right text-purple-dark">Te Betalen Bedrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {report.refereeCosts.map((referee, index) => (
                      <TableRow key={index} className="bg-white hover:bg-purple-50">
                        <TableCell className="font-medium text-purple-dark">{referee.referee}</TableCell>
                        <TableCell className="text-center text-purple-dark">{referee.matchCount}</TableCell>
                        <TableCell className="text-right font-semibold text-purple-dark">
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
            <Card className="border-purple-light">
              <CardHeader className="bg-purple-100">
                <CardTitle className="text-purple-light">Boetes per Maand</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-purple-100">
                      <TableHead className="text-purple-dark">Maand</TableHead>
                      <TableHead className="text-center text-purple-dark">Aantal Boetes</TableHead>
                      <TableHead className="text-right text-purple-dark">Totaal Bedrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {report.fines.map((month, index) => (
                      <TableRow key={index} className="bg-white hover:bg-purple-50">
                        <TableCell className="font-medium text-purple-dark">{month.month}</TableCell>
                        <TableCell className="text-center text-purple-dark">{month.fineCount}</TableCell>
                        <TableCell className="text-right font-semibold text-purple-dark">
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
            <Card className="border-purple-light">
              <CardHeader className="bg-purple-100">
                <CardTitle className="text-purple-light">Wedstrijden per Maand</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-purple-100">
                      <TableHead className="text-purple-dark">Maand</TableHead>
                      <TableHead className="text-center text-purple-dark">Gespeelde Wedstrijden</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {report.matchStats.map((month, index) => (
                      <TableRow key={index} className="bg-white hover:bg-purple-50">
                        <TableCell className="font-medium text-purple-dark">{month.month}</TableCell>
                        <TableCell className="text-center font-semibold text-purple-dark">
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
            <Card className="border-purple-light">
              <CardHeader className="bg-purple-100">
                <CardTitle className="text-purple-light">Veldkosten per Maand</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-purple-100">
                      <TableHead className="text-purple-dark">Maand</TableHead>
                      <TableHead className="text-center text-purple-dark">Aantal Wedstrijden</TableHead>
                      <TableHead className="text-right text-purple-dark">Totale Kosten</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {report.fieldCosts.map((month, index) => (
                      <TableRow key={index} className="bg-white hover:bg-purple-50">
                        <TableCell className="font-medium text-purple-dark">{month.month}</TableCell>
                        <TableCell className="text-center text-purple-dark">{month.matchCount}</TableCell>
                        <TableCell className="text-right font-semibold text-purple-dark">
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
            <Card className="border-purple-light">
              <CardContent className="text-center py-8 bg-white">
                <p className="text-purple-dark mb-2">Er is een fout opgetreden bij het laden van het rapport.</p>
                <p className="text-sm text-purple-dark opacity-70">{error.message}</p>
              </CardContent>
            </Card>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-dark"></div>
                <p className="text-purple-dark">Rapport laden...</p>
              </div>
            </div>
          )}

          {/* Show message when no data */}
          {report && !isLoading && !error && report.totalMatches === 0 && (
            <Card className="border-purple-light">
              <CardContent className="text-center py-8 bg-white">
                <p className="text-purple-dark">
                  Geen wedstrijdgegevens gevonden voor {selectedMonth ? months.find(m => m.value === selectedMonth)?.label + ' ' : ''}{selectedYear}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Empty state when no referee costs */}
          {report && !isLoading && !error && report.refereeCosts.length === 0 && report.totalMatches > 0 && (
            <Card className="border-purple-light">
              <CardHeader className="bg-purple-100">
                <CardTitle className="text-purple-light">Scheidsrechter Betalingen</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8 bg-white">
                <p className="text-purple-dark">
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