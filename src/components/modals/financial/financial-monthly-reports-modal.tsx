import React, { useState } from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Download, Euro, ChevronDown, ChevronRight, Users, Loader2, RefreshCw, Ban } from "lucide-react";
import { useFinancialSeasonReportModal } from "./useFinancialSeasonReportModal";

interface FinancialMonthlyReportsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FinancialMonthlyReportsModal: React.FC<FinancialMonthlyReportsModalProps> = ({ open, onOpenChange }) => {
  const [expandedReferees, setExpandedReferees] = useState<Set<string>>(new Set());

  const {
    availableSeasons,
    seasons,
    selectedSeasonYear,
    setSelectedSeasonYear,
    selectedMonth,
    setSelectedMonth,
    report,
    error,
    syncStatus,
    isInitialLoad,
    isRefreshing,
    isSeasonsLoading,
    isSeasonsFetched,
    forceResync,
    refetchReport,
  } = useFinancialSeasonReportModal(open);

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
      subtitle="Cijfers uit de database; wedstrijdkosten worden bij openen op de achtergrond bijgewerkt indien nodig."
      size="lg"
      className="max-w-6xl max-h-[80vh] overflow-y-auto"
    >

        <div className="space-y-6">
          {isSeasonsLoading && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              <span>Seizoenen laden…</span>
            </div>
          )}

          {isSeasonsFetched && !isSeasonsLoading && (!availableSeasons || availableSeasons.length === 0) && (
            <div className="text-center py-8">
              <p className="text-purple-dark">Geen seizoenen met wedstrijdgegevens gevonden.</p>
              <p className="text-sm text-purple-dark opacity-70">
                Voeg eerst wedstrijden toe of synchroniseer wedstrijdkosten op het financiële overzicht.
              </p>
            </div>
          )}

          {/* Filters - only show if seasons are available */}
          {availableSeasons && availableSeasons.length > 0 && (
            <>
              <div className="filters-row">
                <div className="filter-item filter-select">
                  <label className="text-sm font-medium mb-2 block text-purple-dark">Seizoen</label>
                  <Select value={selectedSeasonYear.toString()} onValueChange={(value) => setSelectedSeasonYear(parseInt(value))}>
                    <SelectTrigger className="w-full dropdown-login-style">
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

                <div className="filter-item filter-select">
                  <label className="text-sm font-medium mb-2 block text-purple-dark">Maand</label>
                  <Select value={selectedMonth?.toString() || "all"} onValueChange={(value) => setSelectedMonth(value === "all" ? null : parseInt(value))}>
                    <SelectTrigger className="w-full dropdown-login-style">
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

                <div className="filter-item filter-button">
                  <label className="text-sm font-medium mb-2 block text-purple-dark opacity-0 pointer-events-none">Export</label>
                  <Button className="btn btn--secondary flex items-center justify-center gap-2 w-full">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
              <style>{`
                .filters-row {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 1rem;
                  width: 100%;
                  align-items: flex-end;
                }

                .filter-item {
                  flex: 1 1 auto;
                  min-width: 0;
                }

                /* Mobile: Seizoen en Maand elk 50%, Export op nieuwe regel 100% */
                .filter-select {
                  flex-basis: calc(50% - 0.5rem);
                  min-width: min(200px, 100%);
                }

                .filter-button {
                  flex-basis: 100%;
                  min-width: min(200px, 100%);
                }

              `}</style>

              <div
                role="status"
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/35 px-3 py-2 text-xs text-muted-foreground"
              >
                <div className="flex items-center gap-2 min-h-[44px] sm:min-h-0">
                  {(isRefreshing || syncStatus === "syncing") && (
                    <>
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin opacity-80" aria-hidden />
                      <span>
                        {syncStatus === "syncing"
                          ? "Wedstrijdkosten synchroniseren op de achtergrond…"
                          : "Rapport vernieuwen…"}
                      </span>
                    </>
                  )}
                  {syncStatus === "synced" && !isRefreshing && (
                    <span>Boekingen bijgewerkt — rapport ververst.</span>
                  )}
                  {syncStatus === "error" && !isRefreshing && (
                    <span className="text-destructive">
                      Sync mislukt. Cijfers kunnen verouderd zijn.
                    </span>
                  )}
                  {syncStatus === "idle" && !isRefreshing && (
                    <span>Gebaseerd op actuele boekingen in de database.</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 min-h-[44px] sm:min-h-7"
                    onClick={() => void refetchReport()}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
                    Vernieuwen
                  </Button>
                  {syncStatus === "error" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 min-h-[44px] sm:min-h-7"
                      onClick={() => void forceResync()}
                    >
                      Sync
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Summary Cards - only show when sync + fetch are complete */}
          {isInitialLoad && availableSeasons && availableSeasons.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="border-purple-light">
                  <CardHeader className="bg-muted p-3">
                    <div className="mx-auto h-3 w-20 animate-pulse rounded bg-muted-foreground/20" />
                  </CardHeader>
                  <CardContent className="bg-white p-3">
                    <div className="mx-auto h-7 w-24 animate-pulse rounded bg-muted-foreground/20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {report && !isInitialLoad && availableSeasons && availableSeasons.length > 0 && (
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 transition-opacity ${isRefreshing ? "opacity-70" : ""}`}>
              {isRefreshing && (
                <div className="col-span-full flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  Vernieuwen…
                </div>
              )}
              <Card className="border-purple-light">
                <CardHeader 
                  className="bg-muted p-3"
                  style={{ 
                    marginTop: 0, 
                    marginBottom: 0, 
                    backgroundColor: 'unset', 
                    background: 'unset',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CardTitle className="text-xs flex items-center justify-center gap-2 text-purple-light">
                    <Users className="h-3 w-3" />
                    Wedstrijden
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-3">
                  <div className="text-xl font-bold text-purple-dark text-center">
                    {report.totalMatches}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-light">
                <CardHeader 
                  className="bg-muted p-3"
                  style={{ 
                    marginTop: 0, 
                    marginBottom: 0, 
                    backgroundColor: 'unset', 
                    background: 'unset',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CardTitle className="text-xs flex items-center justify-center gap-2 text-purple-light">
                    <Euro className="h-3 w-3" />
                    Veldkosten
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-3">
                  <div className="text-lg font-bold text-purple-dark text-center">
                    {formatCurrency(report.totalFieldCosts)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-light">
                <CardHeader 
                  className="bg-muted p-3"
                  style={{ 
                    marginTop: 0, 
                    marginBottom: 0, 
                    backgroundColor: 'unset', 
                    background: 'unset',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CardTitle className="text-xs flex items-center justify-center gap-2 text-purple-light">
                    <Euro className="h-3 w-3" />
                    Scheidsrechters
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-3">
                  <div className="text-lg font-bold text-purple-dark text-center">
                    {formatCurrency(report.totalRefereeCosts)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-light">
                <CardHeader 
                  className="bg-muted p-3"
                  style={{ 
                    marginTop: 0, 
                    marginBottom: 0, 
                    backgroundColor: 'unset', 
                    background: 'unset',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CardTitle className="text-xs flex items-center justify-center gap-2 text-purple-light">
                    <Euro className="h-3 w-3" />
                    Administratie
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-3">
                  <div className="text-lg font-bold text-purple-dark text-center">
                    {formatCurrency(report.totalAdminCosts)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-light">
                <CardHeader 
                  className="bg-muted p-3"
                  style={{ 
                    marginTop: 0, 
                    marginBottom: 0, 
                    backgroundColor: 'unset', 
                    background: 'unset',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CardTitle className="text-xs flex items-center justify-center gap-2 text-purple-light">
                    <Euro className="h-3 w-3" />
                    Boetes
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-3">
                  <div className="text-lg font-bold text-purple-dark text-center">
                    {formatCurrency(report.totalFines)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-light">
                <CardHeader
                  className="bg-muted p-3"
                  style={{
                    marginTop: 0,
                    marginBottom: 0,
                    backgroundColor: "unset",
                    background: "unset",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CardTitle className="text-xs flex items-center justify-center gap-2 text-purple-light">
                    <Ban className="h-3 w-3" />
                    Forfaits
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-3">
                  <div className="text-xl font-bold text-purple-dark text-center">
                    {report.totalForfaits}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Scheidsrechter Betalingen - Improved with expandable match details */}
          {report && !isInitialLoad && report.refereeCosts.length > 0 && availableSeasons && availableSeasons.length > 0 && (
            <Card className="border-purple-light">
              <CardHeader className="bg-purple-100">
                <CardTitle className="text-purple-light flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Scheidsrechter Betalingen
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-white p-0">
                {/* Mobile: Collapsible cards */}
                <div className="block divide-y divide-border">
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

                {/* Desktop: Table with expandable rows - removed for mobile-only */}
                <div className="hidden">
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
                            style={{ backgroundColor: 'white' }}
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

          {/* Boetes — compact: totaal per periode + detail per regel */}
          {report && !isInitialLoad && report.fines && report.fines.length > 0 && (
            <Card className="border-purple-light">
              <CardHeader className="bg-purple-100 py-3">
                <CardTitle className="text-purple-light text-sm font-semibold">
                  {selectedMonth != null ? "Boetes (maand)" : "Boetes (seizoen)"}
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border bg-white p-0">
                {report.fines.map((bucket, index) => (
                  <div key={index} className="space-y-2 px-3 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
                      <span className="font-medium text-purple-dark">{bucket.month}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {bucket.fineCount}× · {formatCurrency(bucket.totalFines)}
                      </span>
                    </div>
                    {bucket.lines && bucket.lines.length > 0 ? (
                      <div className="overflow-x-auto rounded border border-border/60">
                        <table className="w-full min-w-[520px] border-collapse text-[11px] sm:text-xs">
                          <thead>
                            <tr className="border-b border-border/80 bg-muted/40 text-left text-muted-foreground">
                              <th className="px-2 py-1.5 font-medium">Datum</th>
                              <th className="px-2 py-1.5 font-medium">Nr.</th>
                              <th className="px-2 py-1.5 font-medium">Wedstrijd</th>
                              <th className="px-2 py-1.5 font-medium">Ploeg</th>
                              <th className="px-2 py-1.5 font-medium">Soort</th>
                              <th className="px-2 py-1.5 text-right font-medium">€</th>
                            </tr>
                          </thead>
                          <tbody className="text-purple-dark">
                            {bucket.lines.map((line, li) => (
                              <tr key={li} className="border-b border-border/50 last:border-0">
                                <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
                                  {line.matchDate ? formatDate(line.matchDate) : "—"}
                                </td>
                                <td className="px-2 py-1.5 font-mono text-[10px] sm:text-xs">{line.uniqueNumber}</td>
                                <td className="max-w-[200px] px-2 py-1.5" title={`${line.homeTeam} – ${line.awayTeam}`}>
                                  <span className="line-clamp-2 leading-tight">
                                    {line.homeTeam} – {line.awayTeam}
                                  </span>
                                </td>
                                <td className="max-w-[120px] truncate px-2 py-1.5" title={line.teamName}>
                                  {line.teamName}
                                </td>
                                <td className="max-w-[140px] truncate px-2 py-1.5 text-muted-foreground" title={line.costLabel}>
                                  {line.costLabel}
                                </td>
                                <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums font-medium">
                                  {formatCurrency(line.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Geen detailregels (alleen totaal).</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Veldkosten — compact: totaal per periode + welke wedstrijden / welke ploeg */}
          {report && !isInitialLoad && report.fieldCosts && report.fieldCosts.length > 0 && (
            <Card className="border-purple-light">
              <CardHeader className="bg-purple-100 py-3">
                <CardTitle className="text-purple-light text-sm font-semibold">
                  {selectedMonth != null ? "Veldkosten (maand)" : "Veldkosten (seizoen)"}
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border bg-white p-0">
                {report.fieldCosts.map((bucket, index) => (
                  <div key={index} className="space-y-2 px-3 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
                      <span className="font-medium text-purple-dark">{bucket.month}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {bucket.matchCount} wd · {bucket.bookingLines ?? "—"} lijnen · {formatCurrency(bucket.totalCost)}
                      </span>
                    </div>
                    {bucket.lines && bucket.lines.length > 0 ? (
                      <div className="overflow-x-auto rounded border border-border/60">
                        <table className="w-full min-w-[480px] border-collapse text-[11px] sm:text-xs">
                          <thead>
                            <tr className="border-b border-border/80 bg-muted/40 text-left text-muted-foreground">
                              <th className="px-2 py-1.5 font-medium">Datum</th>
                              <th className="px-2 py-1.5 font-medium">Nr.</th>
                              <th className="px-2 py-1.5 font-medium">Wedstrijd</th>
                              <th className="px-2 py-1.5 font-medium">Ploeg</th>
                              <th className="px-2 py-1.5 text-right font-medium">€</th>
                            </tr>
                          </thead>
                          <tbody className="text-purple-dark">
                            {bucket.lines.map((line, li) => (
                              <tr key={li} className="border-b border-border/50 last:border-0">
                                <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
                                  {line.matchDate ? formatDate(line.matchDate) : "—"}
                                </td>
                                <td className="px-2 py-1.5 font-mono text-[10px] sm:text-xs">{line.uniqueNumber}</td>
                                <td className="max-w-[220px] px-2 py-1.5" title={`${line.homeTeam} – ${line.awayTeam}`}>
                                  <span className="line-clamp-2 leading-tight">
                                    {line.homeTeam} – {line.awayTeam}
                                  </span>
                                </td>
                                <td className="max-w-[120px] truncate px-2 py-1.5" title={line.billedTeam}>
                                  {line.billedTeam}
                                </td>
                                <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums font-medium">
                                  {formatCurrency(line.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Geen veldboekingen voor deze periode.</p>
                    )}
                  </div>
                ))}
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

          {/* Show message when no data but seasons are available */}
          {report && !isInitialLoad && !error && report.totalMatches === 0 && availableSeasons && availableSeasons.length > 0 && (
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

