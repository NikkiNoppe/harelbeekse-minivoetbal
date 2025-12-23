import React, { useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { monthlyReportsService, type MonthlyRefereeCosts } from "@/services/financial";
import { Calendar, Download, Euro, ChevronDown, ChevronRight, Users } from "lucide-react";

interface FinancialMonthlyReportsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FinancialMonthlyReportsModal: React.FC<FinancialMonthlyReportsModalProps> = ({ open, onOpenChange }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  // Determine current season: if we're in Aug-Dec, it's currentYear/currentYear+1, else (currentYear-1)/currentYear
  const currentSeasonYear = currentMonth >= 6 ? currentYear : currentYear - 1;
  
  const [selectedSeasonYear, setSelectedSeasonYear] = useState(currentSeasonYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [expandedReferees, setExpandedReferees] = useState<Set<string>>(new Set());

  // Fetch available seasons from actual transaction data
  const { data: availableSeasons } = useQuery({
    queryKey: ['available-seasons'],
    queryFn: monthlyReportsService.getAvailableSeasons,
    enabled: open
  });

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['season-report', selectedSeasonYear, selectedMonth],
    queryFn: async () => {
      console.log('Fetching season report for:', { selectedSeasonYear, selectedMonth });
      try {
        // Convert selectedMonth back to actual month and year for API
        let actualMonth = undefined;
        let actualYear = selectedSeasonYear;
        
        if (selectedMonth !== null) {
          if (selectedMonth <= 12) {
            // July-December of start year
            actualMonth = selectedMonth;
            actualYear = selectedSeasonYear;
          } else {
            // January-June of end year
            actualMonth = selectedMonth - 12;
            actualYear = selectedSeasonYear + 1;
          }
        }
        
        const result = await monthlyReportsService.getSeasonReport(selectedSeasonYear, actualMonth, actualYear);
        console.log('Season report data:', result);
        return result;
      } catch (err) {
        console.error('Error fetching season report:', err);
        throw err;
      }
    },
    enabled: open && !!availableSeasons && availableSeasons.length > 0,
    retry: 2,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const toggleRefereeExpanded = (referee: string) => {
    setExpandedReferees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(referee)) {
        newSet.delete(referee);
      } else {
        newSet.add(referee);
      }
      return newSet;
    });
  };

  // Use available seasons from database or fallback to current season
  const seasons = availableSeasons && availableSeasons.length > 0 
    ? availableSeasons.map(season => ({
        year: season.startYear,
        label: season.season
      }))
    : [{
        year: currentSeasonYear,
        label: `${currentSeasonYear}/${currentSeasonYear + 1}`
      }];

  // Update selected season if it's not available in the fetched seasons
  React.useEffect(() => {
    if (availableSeasons && availableSeasons.length > 0) {
      const isCurrentSeasonAvailable = availableSeasons.some(s => s.startYear === selectedSeasonYear);
      if (!isCurrentSeasonAvailable) {
        setSelectedSeasonYear(availableSeasons[0].startYear);
      }
    }
  }, [availableSeasons, selectedSeasonYear]);
  
  // Generate season months based on season year (July to June)
  const getSeasonMonths = (seasonYear: number) => {
    const months = [];
    // July to December of season start year
    for (let month = 7; month <= 12; month++) {
      months.push({
        value: month,
        label: `${getMonthName(month)} ${seasonYear}`,
        year: seasonYear,
        month: month
      });
    }
    // January to June of season end year
    for (let month = 1; month <= 6; month++) {
      months.push({
        value: month + 12, // Offset to make unique values
        label: `${getMonthName(month)} ${seasonYear + 1}`,
        year: seasonYear + 1,
        month: month
      });
    }
    return months;
  };
  
  const getMonthName = (month: number) => {
    const monthNames = [
      'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
      'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
    ];
    return monthNames[month - 1];
  };
  
  const seasonMonths = getSeasonMonths(selectedSeasonYear);

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Seizoen Kostenrapportage"
      subtitle="Bekijk seizoen/maandelijkse kosten, scheidsrechterbetalingen en boetes voor teams"
      size="lg"
      className="max-w-6xl max-h-[80vh] overflow-y-auto"
      secondaryAction={{
        label: "Sluiten",
        onClick: () => onOpenChange(false),
        variant: "secondary",
      }}
    >

        <div className="space-y-6">
          {/* Show message if no seasons available */}
          {(!availableSeasons || availableSeasons.length === 0) && !isLoading && (
            <div className="text-center py-8">
              <p className="text-purple-dark">Geen seizoenen met wedstrijdgegevens gevonden.</p>
              <p className="text-sm text-purple-dark opacity-70">Voeg eerst wedstrijden toe om rapporten te kunnen genereren.</p>
            </div>
          )}

          {/* Filters - only show if seasons are available */}
          {availableSeasons && availableSeasons.length > 0 && (
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-2 block text-purple-dark">Seizoen</label>
                <Select value={selectedSeasonYear.toString()} onValueChange={(value) => setSelectedSeasonYear(parseInt(value))}>
                  <SelectTrigger className="w-40 dropdown-login-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dropdown-content-login-style z-[1002]">
                    {seasons.map(season => (
                      <SelectItem key={season.year} value={season.year.toString()} className="dropdown-item-login-style">
                        {season.label}
                      </SelectItem>
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
                  <SelectContent className="dropdown-content-login-style z-[1002]">
                    <SelectItem value="all" className="dropdown-item-login-style">Alle maanden</SelectItem>
                    {seasonMonths.map(month => (
                      <SelectItem key={month.value} value={month.value.toString()} className="dropdown-item-login-style">
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="btn btn--secondary flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          )}

          {/* Summary Cards - only show if data available */}
          {report && availableSeasons && availableSeasons.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Card className="border-purple-light">
                <CardHeader className="bg-muted p-3 md:p-4">
                  <CardTitle className="text-xs md:text-sm flex items-center gap-2 text-purple-light">
                    <Users className="h-3 w-3 md:h-4 md:w-4" />
                    Wedstrijden
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-3 md:p-4">
                  <div className="text-xl md:text-2xl font-bold text-purple-dark">
                    {report.totalMatches}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-light">
                <CardHeader className="bg-muted p-3 md:p-4">
                  <CardTitle className="text-xs md:text-sm flex items-center gap-2 text-purple-light">
                    <Euro className="h-3 w-3 md:h-4 md:w-4" />
                    Veldkosten
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-3 md:p-4">
                  <div className="text-lg md:text-2xl font-bold text-purple-dark">
                    {formatCurrency(report.totalFieldCosts)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-light">
                <CardHeader className="bg-muted p-3 md:p-4">
                  <CardTitle className="text-xs md:text-sm flex items-center gap-2 text-purple-light">
                    <Euro className="h-3 w-3 md:h-4 md:w-4" />
                    Scheidsrechters
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-3 md:p-4">
                  <div className="text-lg md:text-2xl font-bold text-purple-dark">
                    {formatCurrency(report.totalRefereeCosts)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-light">
                <CardHeader className="bg-muted p-3 md:p-4">
                  <CardTitle className="text-xs md:text-sm flex items-center gap-2 text-purple-light">
                    <Euro className="h-3 w-3 md:h-4 md:w-4" />
                    Boetes
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-3 md:p-4">
                  <div className="text-lg md:text-2xl font-bold text-purple-dark">
                    {formatCurrency(report.totalFines)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Scheidsrechter Betalingen - Improved with expandable match details */}
          {report && report.refereeCosts.length > 0 && availableSeasons && availableSeasons.length > 0 && (
            <Card className="border-purple-light">
              <CardHeader className="bg-purple-100">
                <CardTitle className="text-purple-light flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Scheidsrechter Betalingen
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-white p-0">
                {/* Mobile: Collapsible cards */}
                <div className="block md:hidden divide-y divide-border">
                  {report.refereeCosts.map((referee, index) => (
                    <Collapsible 
                      key={index}
                      open={expandedReferees.has(referee.referee)}
                      onOpenChange={() => toggleRefereeExpanded(referee.referee)}
                    >
                      <CollapsibleTrigger className="w-full p-4 hover:bg-muted transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <p className="font-medium text-purple-dark">{referee.referee}</p>
                            <p className="text-sm text-muted-foreground">{referee.matchCount} wedstrijden</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-purple-dark">{formatCurrency(referee.totalCost)}</span>
                            {expandedReferees.has(referee.referee) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {referee.matches && referee.matches.length > 0 && (
                          <div className="px-4 pb-4 space-y-2">
                            {referee.matches.map((match, mIdx) => (
                              <div key={mIdx} className="bg-muted/50 rounded-md p-2 text-sm">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{match.home_team} - {match.away_team}</p>
                                    <p className="text-xs text-muted-foreground">{match.unique_number}</p>
                                  </div>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(match.match_date)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                  {/* Mobile Total row */}
                  <div className="p-4 bg-muted">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-purple-dark">Totaal</p>
                        <p className="text-sm text-muted-foreground">
                          {report.refereeCosts.reduce((sum, ref) => sum + ref.matchCount, 0)} wedstrijden
                        </p>
                      </div>
                      <span className="font-bold text-purple-dark">
                        {formatCurrency(report.refereeCosts.reduce((sum, ref) => sum + ref.totalCost, 0))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop: Table with expandable rows */}
                <div className="hidden md:block">
                  <Table className="table">
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="text-purple-dark w-8"></TableHead>
                        <TableHead className="text-purple-dark">Scheidsrechter</TableHead>
                        <TableHead className="text-center text-purple-dark">Aantal Wedstrijden</TableHead>
                        <TableHead className="text-right text-purple-dark">Te Betalen Bedrag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {report.refereeCosts.map((referee, index) => (
                        <React.Fragment key={index}>
                          <TableRow 
                            className="bg-card hover:bg-muted cursor-pointer"
                            onClick={() => toggleRefereeExpanded(referee.referee)}
                          >
                            <TableCell className="w-8">
                              {referee.matches && referee.matches.length > 0 && (
                                expandedReferees.has(referee.referee) ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-purple-dark">{referee.referee}</TableCell>
                            <TableCell className="text-center text-purple-dark">{referee.matchCount}</TableCell>
                            <TableCell className="text-right font-semibold text-purple-dark">
                              {formatCurrency(referee.totalCost)}
                            </TableCell>
                          </TableRow>
                          {/* Expanded match details */}
                          {expandedReferees.has(referee.referee) && referee.matches && referee.matches.length > 0 && (
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={4} className="p-0">
                                <div className="px-8 py-3">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-xs text-muted-foreground">Wedstrijd</TableHead>
                                        <TableHead className="text-xs text-muted-foreground">Teams</TableHead>
                                        <TableHead className="text-xs text-muted-foreground text-right">Datum</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {referee.matches.map((match, mIdx) => (
                                        <TableRow key={mIdx} className="border-0">
                                          <TableCell className="py-1 text-sm">{match.unique_number}</TableCell>
                                          <TableCell className="py-1 text-sm">{match.home_team} - {match.away_team}</TableCell>
                                          <TableCell className="py-1 text-sm text-right">{formatDate(match.match_date)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                      {/* Totaal row */}
                      <TableRow className="bg-purple-100 border-t-2 border-purple-light">
                        <TableCell></TableCell>
                        <TableCell className="font-bold text-purple-dark">Totaal</TableCell>
                        <TableCell className="text-center font-bold text-purple-dark">
                          {report.refereeCosts.reduce((sum, ref) => sum + ref.matchCount, 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-purple-dark">
                          {formatCurrency(report.refereeCosts.reduce((sum, ref) => sum + ref.totalCost, 0))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Boetes per Seizoen/Maand */}
          {report?.fines && report.fines.length > 0 && (
            <Card className="border-purple-light">
              <CardHeader className="bg-purple-100">
                <CardTitle className="text-purple-light">
                  {selectedMonth ? 'Boetes per Maand' : 'Boetes per Seizoen'}
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <Table className="table">
                  <TableHeader>
                    <TableRow className="bg-purple-100">
                      <TableHead className="text-purple-dark">
                        {selectedMonth ? 'Maand' : 'Seizoen'}
                      </TableHead>
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

          {/* Veldkosten per Seizoen/Maand */}
          {report?.fieldCosts && report.fieldCosts.length > 0 && (
            <Card className="border-purple-light">
              <CardHeader className="bg-purple-100">
                <CardTitle className="text-purple-light">
                  {selectedMonth ? 'Veldkosten per Maand' : 'Veldkosten per Seizoen'}
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <Table className="table">
                  <TableHeader>
                    <TableRow className="bg-purple-100">
                      <TableHead className="text-purple-dark">
                        {selectedMonth ? 'Maand' : 'Seizoen'}
                      </TableHead>
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
                <p className="text-sm text-purple-dark opacity-70">{(error as Error).message}</p>
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

          {/* Show message when no data but seasons are available */}
          {report && !isLoading && !error && report.totalMatches === 0 && availableSeasons && availableSeasons.length > 0 && (
            <Card className="border-purple-light">
              <CardContent className="text-center py-8 bg-white">
                <p className="text-purple-dark mb-2">Geen wedstrijden gevonden voor deze periode.</p>
                <p className="text-sm text-purple-dark opacity-70">
                  Selecteer een andere maand of bekijk het hele seizoen.
                </p>
              </CardContent>
            </Card>
          )}

        </div>
    </AppModal>
  );
};

export default FinancialMonthlyReportsModal;