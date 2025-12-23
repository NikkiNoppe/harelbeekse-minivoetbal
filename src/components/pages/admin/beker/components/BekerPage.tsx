import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppAlertModal } from "@/components/ui/app-alert-modal";
import { Loader2, Trophy, AlertCircle, CheckCircle, Trash2 } from "lucide-react";

import BekerDateSelector from "./BekerDateSelector";
import { teamService, Team } from "@/services/core";
import { bekerService } from "@/services/match/cupService";
import AdminTeamSelector from "@/components/pages/admin/common/components/AdminTeamSelector";
import { supabase } from "@/integrations/supabase/client";
const BekerPage: React.FC = () => {
  const { toast } = useToast();
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [tournamentDates, setTournamentDates] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [existingCup, setExistingCup] = useState<null | {
    achtste_finales: any[];
    kwartfinales: any[];
    halve_finales: any[];
    finale: any | null;
  }>(null);
  const [byeTeamId, setByeTeamId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<Array<{
    unique_number: string;
    speeldag: string;
    home_team_id: number | null;
    away_team_id: number | null;
    match_date: string;
    match_time: string;
    venue: string;
    slot_index: number;
    details: { homeScore?: number; awayScore?: number; combined?: number; maxCombined: number; priority?: number; day_of_week?: number }
  }> | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);
  const teamNameById = useMemo(() => {
    const map = new Map<number, string>();
    teams.forEach(t => map.set(t.team_id, t.team_name));
    return map;
  }, [teams]);

  // Load teams from database on component mount
  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const [teamsData, cupData] = await Promise.all([
          teamService.getAllTeams(),
          bekerService.getCupMatches().catch(() => null)
        ]);
        setTeams(teamsData);
        if (cupData) setExistingCup(cupData);
      } catch (error) {
        console.error('Error loading initial beker data:', error);
        toast({
          title: "Fout bij laden",
          description: "Kon data niet laden",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, [toast]);

  const reloadExistingCup = useCallback(async () => {
    try {
      const cupData = await bekerService.getCupMatches();
      setExistingCup(cupData);
    } catch (e) {
      setExistingCup(null);
    }
  }, []);

  // Realtime: update bracket when cup matches change elsewhere (e.g., match form updates)
  useEffect(() => {
    const channel = supabase
      .channel('cup-matches-live')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'matches',
        filter: 'is_cup_match=eq.true'
      }, () => {
        reloadExistingCup();
      })
      .subscribe((status) => {
        // Silently handle subscription errors to prevent console errors that affect SEO
        if (status === 'CHANNEL_ERROR') {
          console.debug('Realtime connection unavailable, continuing without live updates');
        }
      });
    return () => {
      try { supabase.removeChannel(channel); } catch (_) {}
    };
  }, [reloadExistingCup]);

  const handleCancelTournament = useCallback(() => {
    setSelectedTeams([]);
    setTournamentDates([]);
    setByeTeamId(null);
    setPreviewPlan(null);
    toast({ title: "Geannuleerd", description: "Teams en speeldata gewist." });
  }, [toast]);

  // Memoize team selection handler
  const handleTeamSelection = useCallback((teamId: number) => {
    setSelectedTeams(prev => {
      if (prev.includes(teamId)) {
        return prev.filter(id => id !== teamId);
      } else {
        return [...prev, teamId];
      }
    });
  }, []);

  // Memoize date selection handler
  const handleDatesSelected = useCallback((dates: string[]) => {
    setTournamentDates(dates);
    setShowDateSelector(false);
    toast({
      title: "Data geselecteerd",
      description: `${dates.length} speeldata zijn geselecteerd voor de beker`,
    });
  }, [toast]);

  // Memoize cancel handler
  const handleCancelDateSelection = useCallback(() => {
    setShowDateSelector(false);
    setByeTeamId(null);
  }, []);

  // Memoize tournament creation handler
  const handleCreateTournament = useCallback(async () => {
    const requiredWeeks = selectedTeams.length === 16 ? 5 : 4;
    if (selectedTeams.length < 2) {
      toast({ title: "Onvoldoende teams", description: "Selecteer minstens 2 teams", variant: "destructive" });
      return;
    }
    if (tournamentDates.length !== requiredWeeks) {
      toast({ title: "Onvoldoende data", description: `Selecteer exact ${requiredWeeks} speeldata`, variant: "destructive" });
      return;
    }
    if (selectedTeams.length % 2 === 1 && !byeTeamId) {
      toast({ title: "Selecteer bye team", description: "Bij oneven aantal teams moet één team vrijgesteld worden.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      // If a preview exists, confirm importing that exact plan for determinisme
      let createResult: { success: boolean; message: string };
      if (previewPlan && previewPlan.length > 0) {
        createResult = await bekerService.createCupFromPlan(previewPlan);
      } else {
        createResult = await bekerService.createCupTournament(selectedTeams, tournamentDates, byeTeamId);
      }
      if (createResult.success) {
        toast({ title: "Beker aangemaakt", description: createResult.message });
        // Assign bye team to QF-1 if applicable
        if (selectedTeams.length % 2 === 1 && byeTeamId) {
          const assign = await bekerService.assignTeamToMatch('QF-1', true, byeTeamId);
          if (!assign.success) {
            toast({ title: "Bye toewijzing mislukt", description: assign.message, variant: "destructive" });
          }
        }
        setSelectedTeams([]);
        setTournamentDates([]);
        setByeTeamId(null);
        setPreviewPlan(null);
        await reloadExistingCup();
      } else {
        toast({ title: "Fout bij aanmaken", description: createResult.message, variant: "destructive" });
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: "Fout",
        description: "Kan beker niet aanmaken",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }, [selectedTeams, tournamentDates, toast, reloadExistingCup]);

  const handleGeneratePreview = useCallback(async () => {
    const requiredWeeks = selectedTeams.length === 16 ? 5 : 4;
    if (selectedTeams.length < 2) {
      toast({ title: "Onvoldoende teams", description: "Selecteer minstens 2 teams", variant: "destructive" });
      return;
    }
    if (tournamentDates.length !== requiredWeeks) {
      toast({ title: "Onvoldoende data", description: `Selecteer exact ${requiredWeeks} speeldata`, variant: "destructive" });
      return;
    }
    setIsPreviewing(true);
    try {
      const res = await bekerService.previewCupTournament(selectedTeams, tournamentDates, 1, byeTeamId || null);
      if (!res.success || !res.plan || res.plan.length === 0) {
        toast({ title: "Preview mislukt", description: res.message || "Geen plan gegenereerd", variant: "destructive" });
        setPreviewPlan(null);
        setPreviewTotal(null);
        return;
      }
      setPreviewPlan(res.plan);
      setPreviewTotal(res.totalCombined ?? null);
      toast({ title: "Preview klaar", description: `Preview bevat ${res.plan.length} wedstrijden (totale score ${res.totalCombined ?? '-'}).` });
    } catch (e) {
      toast({ title: "Preview fout", description: "Er ging iets mis bij genereren", variant: "destructive" });
      setPreviewPlan(null);
      setPreviewTotal(null);
    } finally {
      setIsPreviewing(false);
    }
  }, [selectedTeams, tournamentDates, toast]);

  const handleDeleteCup = useCallback(async () => {
    setIsDeleting(true);
    try {
      const result = await bekerService.deleteCupTournament();
      if (result.success) {
        toast({ title: "Beker verwijderd", description: result.message });
        setExistingCup(null);
      } else {
        toast({ title: "Fout bij verwijderen", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Fout", description: "Kon beker niet verwijderen", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [toast]);

  // Memoize validation states
  const canCreateTournament = useMemo(() => {
    const requiredWeeks = selectedTeams.length === 16 ? 5 : 4;
    const hasBasics = selectedTeams.length >= 2 && tournamentDates.length === requiredWeeks;
    const needsBye = selectedTeams.length % 2 === 1;
    return hasBasics && (!needsBye || !!byeTeamId);
  }, [selectedTeams.length, tournamentDates.length, byeTeamId]);

  const canSelectDates = useMemo(() => selectedTeams.length >= 2, [selectedTeams.length]);

  const hasExistingCup = useMemo(() => {
    if (!existingCup) return false;
    const total = (existingCup.achtste_finales?.length || 0) +
      (existingCup.kwartfinales?.length || 0) +
      (existingCup.halve_finales?.length || 0) +
      (existingCup.finale ? 1 : 0);
    return total > 0;
  }, [existingCup]);

  const cupCounts = useMemo(() => {
    return {
      total: ((existingCup?.achtste_finales?.length || 0) + (existingCup?.kwartfinales?.length || 0) + (existingCup?.halve_finales?.length || 0) + (existingCup?.finale ? 1 : 0)),
      achtste: existingCup?.achtste_finales?.length || 0,
      kwart: existingCup?.kwartfinales?.length || 0,
      halve: existingCup?.halve_finales?.length || 0,
      finale: existingCup?.finale ? 1 : 0,
    };
  }, [existingCup]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-sm text-muted-foreground">Teams laden uit database...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Beker</h2>
          <p className="text-muted-foreground">Beheer het bekertoernooi - aanmaken, verwijderen en overzicht</p>
        </div>
      </div>

      <section className="space-y-6 mt-6">
        {/* Nieuwe Beker Aanmaken */}
        <Card>
          <CardHeader>
            <CardTitle>Nieuwe Beker Aanmaken</CardTitle>
            <CardDescription>Maak een nieuw bekertoernooi aan met 16 teams en 5 speelweken</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-base">Teams Selecteren</CardTitle>
                  <Button onClick={() => setShowDateSelector(true)} disabled={!canSelectDates} className="btn btn--primary">
                    <Trophy className="mr-2 h-4 w-4" /> Speeldata Selecteren
                  </Button>
                </div>
                <AdminTeamSelector
                  teams={teams}
                  selectedIds={selectedTeams}
                  onToggle={handleTeamSelection}
                  onSelectAll={() => setSelectedTeams(teams.map(t => t.team_id))}
                  onClearAll={() => setSelectedTeams([])}
                />
                <div className="mt-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{selectedTeams.length} / {teams.length} geselecteerd</Badge>
                  <span className="ml-2">Minstens 2 teams. 16 teams = 5 weken, anders 4.</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <CardTitle className="mb-2 text-base">Speeldata</CardTitle>
                  {tournamentDates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nog geen speeldata geselecteerd</p>
                  ) : (
                    <div className="space-y-1">
                      {tournamentDates.map((date, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">Speelweek {index + 1}</span>
                          <span className="text-sm font-medium">{new Date(date).toLocaleDateString('nl-NL')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    disabled={isPreviewing || !canCreateTournament}
                    className="btn btn--outline sm:flex-1"
                    onClick={handleGeneratePreview}
                  >
                    {isPreviewing ? "Preview genereren..." : "Preview genereren"}
                  </button>
                  <button
                    disabled={!canCreateTournament || isCreating}
                    className="btn btn--primary sm:flex-1"
                    onClick={() => setShowConfirm(true)}
                  >
                    {isCreating ? "Beker aanmaken..." : (previewPlan ? "Bevestigen en importeren" : "Beker Aanmaken")}
                  </button>
                  <button onClick={handleCancelTournament} disabled={isCreating} className="btn btn--secondary">
                    Annuleren
                  </button>
                </div>

                <AppAlertModal
                  open={showConfirm}
                  onOpenChange={setShowConfirm}
                  title="Beker Aanmaken"
                  description={
                    <p className="text-xs text-muted-foreground">
                      Weet je zeker dat je de beker wilt aanmaken met {selectedTeams.length} teams en {tournamentDates.length} speeldata? Deze actie kan niet ongedaan worden gemaakt.
                    </p>
                  }
                  confirmAction={{
                    label: previewPlan ? "Bevestigen en importeren" : "Beker Aanmaken",
                    onClick: () => {
                      setShowConfirm(false);
                      handleCreateTournament();
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
              </div>
            </div>
          </CardContent>
        </Card>

        {previewPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Preview Beker (scores per match)</CardTitle>
              <CardDescription>
                Geplande wedstrijden met gecombineerde voorkeur-score (max 6). Totale score: {previewTotal ?? '-'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
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
                        <td>{new Date(p.match_date).toLocaleDateString('nl-NL')}</td>
                        <td>{p.match_time}</td>
                        <td>{p.venue}</td>
                        <td>{(p.details?.homeScore ?? 0)} + {(p.details?.awayScore ?? 0)} = {(p.details?.combined ?? 0)} / {p.details?.maxCombined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Beker Beheren */}
        <Card>
          <CardHeader>
            <CardTitle>Beker Beheren</CardTitle>
            <CardDescription>Bekijk en beheer het huidige bekertoernooi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasExistingCup ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Er is een bekertoernooi actief met {cupCounts.total} wedstrijden.
                  </AlertDescription>
                </Alert>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• Achtste finales: {cupCounts.achtste}</div>
                  <div>• Kwartfinales: {cupCounts.kwart}</div>
                  <div>• Halve finales: {cupCounts.halve}</div>
                  <div>• Finale: {cupCounts.finale}</div>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Er is momenteel geen bekertoernooi actief. Maak een nieuwe beker aan om te beginnen.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Beker Verwijderen */}
        <Card>
          <CardHeader>
            <CardTitle>Beker Verwijderen</CardTitle>
            <CardDescription>Verwijder het volledige bekertoernooi. Deze actie kan niet ongedaan worden gemaakt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasExistingCup ? (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Je staat op het punt een actief bekertoernooi met {cupCounts.total} wedstrijden te verwijderen.
                  </AlertDescription>
                </Alert>
                <Button onClick={handleDeleteCup} disabled={isDeleting} variant="destructive" className="w-full">
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verwijderen...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" /> Beker Verwijderen
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Er is momenteel geen actieve beker om te verwijderen.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Date Selector Modal */}
      {showDateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div>
            <BekerDateSelector
              onDatesSelected={handleDatesSelected}
              onCancel={handleCancelDateSelection}
              isLoading={isCreating}
              weeks={selectedTeams.length === 16 ? 5 : 4}
              allowByeSelection={selectedTeams.length % 2 === 1}
              teamsForBye={teams.filter(t => selectedTeams.includes(t.team_id)).map(t => ({ team_id: t.team_id, team_name: t.team_name }))}
              onByeSelected={setByeTeamId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(BekerPage); 