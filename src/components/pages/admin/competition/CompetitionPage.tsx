import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppAlertModal } from "@/components/modals";
import { Loader2, Trophy, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { competitionService, CompetitionConfig, CompetitionFormat } from "@/services/match/competitionService";
import { teamService } from "@/services/core/teamService";
import { seasonService } from "@/services/seasonService";
import AdminTeamSelector from "@/components/pages/admin/common/components/AdminTeamSelector";
const AdminCompetitionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [formats, setFormats] = useState<CompetitionFormat[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [venues, setVenues] = useState<any[]>([]);
  const [timeslots, setTimeslots] = useState<any[]>([]);
  const [existingCompetition, setExistingCompetition] = useState<any[]>([]);
  const { toast } = useToast();
  const [previewPlan, setPreviewPlan] = useState<Array<{ unique_number: string; speeldag: string; home_team_id: number; away_team_id: number | null; match_date: string; match_time: string; venue: string; details: { homeScore: number; awayScore: number; combined: number; maxCombined: number } }> | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);
  const [previewTeamTotals, setPreviewTeamTotals] = useState<Record<number, number> | null>(null);
  const teamNameById = React.useMemo(() => {
    const map = new Map<number, string>();
    teams.forEach((t: any) => map.set(t.team_id, t.team_name));
    return map;
  }, [teams]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load teams
      const teamsData = await teamService.getAllTeams();
      setTeams(teamsData);

      // Load formats
      const seasonData = await seasonService.getSeasonData();
      setFormats(seasonData.competition_formats || []);
      setVenues(seasonData.venues || []);
      setTimeslots(seasonData.venue_timeslots || []);

      // Set default dates from season data
      if (seasonData.season_start_date && seasonData.season_end_date) {
        setStartDate(seasonData.season_start_date);
        setEndDate(seasonData.season_end_date);
      }

      // Check for existing competition
      const existingMatches = await competitionService.getCompetitionMatches();
      setExistingCompetition(existingMatches);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Fout bij laden",
        description: "Er is een fout opgetreden bij het laden van de data.",
        variant: "destructive"
      });
    }
  };

  const handleCreateCompetition = async () => {
    if (!selectedFormat || selectedTeams.length === 0 || !startDate || !endDate) {
      toast({
        title: "Incomplete gegevens",
        description: "Vul alle verplichte velden in.",
        variant: "destructive"
      });
      return;
    }

    const format = formats.find(f => f.id.toString() === selectedFormat);
    if (!format) {
      toast({
        title: "Ongeldig format",
        description: "Selecteer een geldig competitieformat.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const config: CompetitionConfig = {
        format,
        start_date: startDate,
        end_date: endDate,
        teams: selectedTeams
      };

      let createResult: { success: boolean; message: string };
      if (previewPlan && previewPlan.length > 0) {
        createResult = await competitionService.createCompetitionFromPlan(previewPlan);
      } else {
        createResult = await competitionService.generateCompetition(config);
      }

      if (createResult.success) {
        toast({ title: "Competitie aangemaakt", description: createResult.message, variant: "default" });
        const existingMatches = await competitionService.getCompetitionMatches();
        setExistingCompetition(existingMatches);
        setPreviewPlan(null);
        setPreviewTotal(null);
      } else {
        toast({ title: "Fout bij aanmaken", description: createResult.message, variant: "destructive" });
      }
    } catch (error) {
      console.error('Error creating competition:', error);
      toast({
        title: "Fout bij aanmaken",
        description: "Er is een fout opgetreden bij het aanmaken van de competitie.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!selectedFormat || selectedTeams.length === 0 || !startDate || !endDate) {
      toast({ title: "Incomplete gegevens", description: "Vul alle verplichte velden in.", variant: "destructive" });
      return;
    }
    const format = formats.find(f => f.id.toString() === selectedFormat);
    if (!format) {
      toast({ title: "Ongeldig format", description: "Selecteer een geldig competitieformat.", variant: "destructive" });
      return;
    }
    // Force fresh preview each time
    setPreviewPlan(null);
    setPreviewTotal(null);
    setIsPreviewing(true);
    try {
      const config: CompetitionConfig = {
        format,
        start_date: startDate,
        end_date: endDate,
        teams: selectedTeams
      };
      const res = await competitionService.previewCompetition(config);
      if (!res.success || !res.plan || res.plan.length === 0) {
        toast({ title: "Preview mislukt", description: res.message || "Geen plan", variant: "destructive" });
        setPreviewPlan(null);
        setPreviewTotal(null);
        setPreviewTeamTotals(null);
        return;
      }
      setPreviewPlan(res.plan);
      setPreviewTotal(res.totalCombined ?? null);
      setPreviewTeamTotals(res.teamTotals ?? null);
      toast({ title: "Preview klaar", description: `Preview bevat ${res.plan.length} wedstrijden (totale score ${res.totalCombined ?? '-'})` });
    } catch (e) {
      toast({ title: "Preview fout", description: "Er ging iets mis bij genereren", variant: "destructive" });
      setPreviewPlan(null);
      setPreviewTotal(null);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCancel = () => {
    setSelectedTeams([]);
    setSelectedFormat("");
    setPreviewPlan(null);
    setPreviewTotal(null);
  };

  const handleDeleteCompetition = async () => {
    if (!confirm("Weet je zeker dat je de competitie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) {
      return;
    }

    setLoading(true);
    try {
      const result = await competitionService.deleteCompetition();
      
      if (result.success) {
        toast({
          title: "Competitie verwijderd",
          description: result.message,
          variant: "default"
        });
        
        setExistingCompetition([]);
      } else {
        toast({
          title: "Fout bij verwijderen",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting competition:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de competitie.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeamToggle = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const hasExistingCompetition = existingCompetition.length > 0;

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Competitie</h2>
            <p className="text-muted-foreground">
              Beheer de competitie - aanmaken, verwijderen en overzicht
            </p>
          </div>
        </div>

      <section className="space-y-6 mt-6">
        {/* Competitie Aanmaken */}
        <Card>
          <CardHeader>
            <CardTitle>Nieuwe Competitie Aanmaken</CardTitle>
            <CardDescription>
              Maak een nieuwe competitie aan met automatische wedstrijdgeneratie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Voorziene presets (alleen-lezen) */}
            <div className="space-y-2">
              <Label>Seizoensinstellingen (alleen-lezen)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-md border bg-white">
                  <div className="text-xs text-muted-foreground">Seizoensperiode</div>
                  <div className="font-medium mt-1">
                    {startDate && endDate ? (
                      <span>{startDate} → {endDate}</span>
                    ) : (
                      <span>Onbekend</span>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-md border bg-white">
                  <div className="text-xs text-muted-foreground">Locaties</div>
                  <div className="font-medium mt-1">{venues.length} locatie(s)</div>
                  {venues.length > 0 && (
                    <ul className="mt-2 text-sm text-muted-foreground space-y-1 max-h-24 overflow-auto">
                      {venues.map((v: any, idx: number) => (
                        <li key={idx}>• {v.name || v.venue_name || `Locatie ${idx+1}`}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="p-3 rounded-md border bg-white">
                  <div className="text-xs text-muted-foreground">Tijdstippen</div>
                  <div className="font-medium mt-1">{timeslots.length} tijdstip(pen)</div>
                  {timeslots.length > 0 && (
                    <ul className="mt-2 text-sm text-muted-foreground space-y-1 max-h-24 overflow-auto">
                      {timeslots.map((t: any, idx: number) => (
                        <li key={idx}>• {(t.start_time && t.end_time) ? `${t.start_time} - ${t.end_time}` : (t.label || t.timeslot_id || `Tijdslot ${idx+1}`)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Format + Teams side-by-side layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="format">Competitie Format</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een format" />
                  </SelectTrigger>
                  <SelectContent>
                    {formats.map((format) => (
                      <SelectItem key={format.id} value={format.id.toString()}>
                        {format.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFormat && (
                  <p className="text-sm text-muted-foreground">
                    {formats.find(f => f.id.toString() === selectedFormat)?.description}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <AdminTeamSelector
                  label={`Selecteer Teams`}
                  teams={teams}
                  selectedIds={selectedTeams}
                  onToggle={handleTeamToggle}
                  onSelectAll={() => setSelectedTeams(teams.map(t => t.team_id))}
                  onClearAll={() => setSelectedTeams([])}
                  className="w-full"
                />

                {/* Speelmoment voorkeuren (alleen-lezen) voor geselecteerde teams */}
                <div className="mt-2">
                  <Label>Speelmoment voorkeuren</Label>
                  {selectedTeams.length === 0 ? (
                    <div className="text-sm text-muted-foreground mt-1">
                      Selecteer één of meerdere teams om hun speelmoment voorkeuren te bekijken.
                    </div>
                  ) : (
                    <div className="mt-2 grid grid-cols-1 gap-2 max-h-60 overflow-auto">
                      {selectedTeams.map((teamId) => {
                        const team = teams.find((t: any) => t.team_id === teamId);
                        const prefs = team?.preferred_play_moments as any | undefined;
                        const dayList: string[] = Array.isArray(prefs?.days) ? prefs!.days : [];
                        const timeslotList: string[] = Array.isArray(prefs?.timeslots) ? prefs!.timeslots : [];
                        const venueIdList: number[] = Array.isArray(prefs?.venues) ? prefs!.venues : [];
                        const venueNames = venueIdList.map((id) => {
                          const v = venues.find((vv: any) => (vv.venue_id ?? vv.id) === id);
                          return v?.name || v?.venue_name || `Locatie ${id}`;
                        });

                        return (
                          <div key={teamId} className="p-3 rounded-md border bg-white">
                            <div className="text-sm font-semibold mb-1">{team?.team_name || `Team ${teamId}`}</div>
                            {prefs ? (
                              <div className="text-sm space-y-1">
                                <div className="flex gap-2">
                                  <span className="text-muted-foreground min-w-24">Dagen:</span>
                                  <span className="font-medium">{dayList.length ? dayList.join(', ') : '-'}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-muted-foreground min-w-24">Tijdstippen:</span>
                                  <span className="font-medium">{timeslotList.length ? timeslotList.join(', ') : '-'}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-muted-foreground min-w-24">Locaties:</span>
                                  <span className="font-medium">{venueNames.length ? venueNames.join(', ') : '-'}</span>
                                </div>
                                {prefs?.notes && (
                                  <div className="flex gap-2">
                                    <span className="text-muted-foreground min-w-24">Notities:</span>
                                    <span className="font-medium">{prefs.notes}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">Geen voorkeuren opgegeven.</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Planning Information */}
            {selectedFormat && selectedTeams.length > 0 && startDate && endDate && (
              <div className="space-y-2">
                <Label>Competitie Planning</Label>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  {(() => {
                    const format = formats.find(f => f.id.toString() === selectedFormat);
                    if (!format) return null;
                    
                    const regularMatches = selectedTeams.length * (selectedTeams.length - 1) / 2; // 1 ronde per team
                    const playoffMatches = 0; // Playoffs worden later apart gegenereerd
                    const totalMatches = regularMatches;
                    const weeksNeeded = Math.ceil(totalMatches / 7);
                    
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    const totalWeeks = Math.ceil(totalDays / 7);
                    
                    const isFeasible = totalWeeks >= weeksNeeded;
                    
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Teams:</span>
                          <span className="font-medium">{selectedTeams.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reguliere competitie:</span>
                          <span className="font-medium">1 ronde (thuis/uit)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reguliere wedstrijden:</span>
                          <span className="font-medium">{regularMatches}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Playoff wedstrijden:</span>
                          <span className="font-medium">Later apart gegenereerd</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Totaal wedstrijden:</span>
                          <span className="font-medium">{totalMatches}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weken nodig:</span>
                          <span className="font-medium">{weeksNeeded}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Beschikbare weken:</span>
                          <span className="font-medium">{totalWeeks}</span>
                        </div>
                        <div className={`flex justify-between font-medium ${isFeasible ? 'text-green-600' : 'text-red-600'}`}>
                          <span>Status:</span>
                          <span>{isFeasible ? '✅ Haalbaar' : '❌ Niet haalbaar'}</span>
                        </div>
                        {!isFeasible && (
                          <div className="text-xs text-muted-foreground mt-2">
                            <p>Suggesties:</p>
                            <ul className="list-disc list-inside space-y-1 mt-1">
                              <li>Verminder het aantal teams</li>
                              <li>Breid de einddatum uit</li>
                              <li>Speel meer wedstrijden per week</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Preview & Create Controls */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                disabled={isPreviewing || isCreating}
                className="btn btn--outline sm:flex-1"
                onClick={handleGeneratePreview}
              >
                {isPreviewing ? 'Preview genereren...' : 'Preview genereren'}
              </button>
              <button onClick={() => setShowConfirm(true)} disabled={isCreating} className="btn btn--primary sm:flex-1">
                {isCreating ? 'Aanmaken...' : (previewPlan ? 'Bevestigen en importeren' : 'Competitie Aanmaken')}
              </button>
              <button onClick={handleCancel} disabled={isCreating} className="btn btn--secondary">
                Annuleren
              </button>
            </div>

            <AppAlertModal
              open={showConfirm}
              onOpenChange={setShowConfirm}
              title="Competitie Aanmaken"
              description={
                <p className="text-xs text-muted-foreground">
                  Weet je zeker dat je de competitie wilt aanmaken met {selectedTeams.length} teams? Deze actie kan niet ongedaan worden gemaakt.
                </p>
              }
              confirmAction={{
                label: previewPlan ? 'Bevestigen en importeren' : 'Competitie Aanmaken',
                onClick: () => {
                  setShowConfirm(false);
                  handleCreateCompetition();
                },
                variant: "primary",
                disabled: isCreating,
                loading: isCreating,
              }}
              cancelAction={{
                label: "Annuleren",
                onClick: () => setShowConfirm(false),
                disabled: isCreating,
              }}
              size="sm"
            />

            {previewPlan && (
              <div className="p-3 rounded-md border bg-white">
                <div className="text-sm font-medium mb-2">Preview (totale score: {previewTotal ?? '-'})</div>
                {previewTeamTotals && (
                  <div className="mb-3">
                    <div className="text-xs text-muted-foreground mb-1">Teamscores (som van voorkeur-scores per team)</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(previewTeamTotals).sort((a, b) => Number(b[1]) - Number(a[1])).map(([teamId, total]) => (
                        <div key={teamId} className="flex justify-between text-xs p-2 bg-muted rounded-lg">
                          <span className="font-medium">{teamNameById.get(Number(teamId)) || teamId}</span>
                          <span>{Number(total).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="w-full overflow-x-auto">
                  <table className="table w-full text-sm">
                    <thead className="tableHead">
                      <tr>
                        <th className="text-left">Speeldag</th>
                        <th className="text-left">Home</th>
                        <th className="text-left">Away</th>
                        <th className="text-left">Datum</th>
                        <th className="text-left">Tijd</th>
                        <th className="text-left">Venue</th>
                        <th className="text-left">Score (home+away/max)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewPlan.map((p, idx) => (
                        <tr key={idx}>
                          <td>{p.speeldag}</td>
                          <td>{p.home_team_id ? (teamNameById.get(p.home_team_id) || p.home_team_id) : '-'}</td>
                          <td>{p.away_team_id ? (teamNameById.get(p.away_team_id) || p.away_team_id) : '-'}</td>
                          <td>{p.match_date ? new Date(p.match_date).toLocaleDateString('nl-NL') : ''}</td>
                          <td>{p.match_time || ''}</td>
                          <td>{p.venue || ''}</td>
                          <td>{(p.details?.homeScore ?? 0)} + {(p.details?.awayScore ?? 0)} = {(p.details?.combined ?? 0)} / {p.details?.maxCombined}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            
          </CardContent>
        </Card>

        {/* Competitie Beheren */}
        <Card>
          <CardHeader>
            <CardTitle>Competitie Beheren</CardTitle>
            <CardDescription>
              Bekijk en beheer de huidige competitie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasExistingCompetition ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Er is een competitie actief met {existingCompetition.length} wedstrijden.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Competitie Statistieken:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Totaal wedstrijden: {existingCompetition.length}</li>
                    <li>• Reguliere wedstrijden: {existingCompetition.filter(m => !m.is_playoff_match).length}</li>
                    <li>• Playoff wedstrijden: {existingCompetition.filter(m => m.is_playoff_match).length}</li>
                  </ul>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Er is momenteel geen competitie actief. Maak een nieuwe competitie aan om te beginnen.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Competitie Verwijderen */}
        <Card>
          <CardHeader>
            <CardTitle>Competitie Verwijderen</CardTitle>
            <CardDescription>
              Verwijder de volledige competitie en alle gegenereerde wedstrijden. Deze actie kan niet ongedaan worden gemaakt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasExistingCompetition ? (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Je staat op het punt een actieve competitie met {existingCompetition.length} wedstrijden te verwijderen.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleDeleteCompetition}
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verwijderen...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Competitie Verwijderen
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Er is momenteel geen actieve competitie om te verwijderen.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AdminCompetitionPage;
