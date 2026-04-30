import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  RefreshCw,
  Check,
  X,
  Star,
  Minus,
  Sparkles,
  Wand2,
  Download,
  Search,
  Filter as FilterIcon,
  Undo2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { assignmentService } from '@/services/scheidsrechter/assignmentService';
import {
  suggestRefereesForSession,
  fetchWorkloadStats,
  type SuggestionCandidate,
} from '@/services/scheidsrechter/autoSuggestService';
import { useAuth } from '@/hooks/useAuth';
import { formatDateWithDay, formatTimeForDisplay } from '@/lib/dateUtils';
import { getLocationOrder } from '@/lib/matchSortingUtils';
import { downloadICalFile, downloadCSVFile, type ICalEvent } from '@/lib/icalUtils';

// Types
interface RefereeInfo {
  user_id: number;
  username: string;
}

interface SessionMatch {
  match_id: number;
  match_date: string;
  location: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  assigned_referee_id: number | null;
  home_team_name: string;
  away_team_name: string;
}

interface Session {
  key: string;
  date: string;
  dateOnly: string;
  location: string;
  matches: SessionMatch[];
}

interface AvailabilityData {
  user_id: number;
  match_id: number | null;
  poll_group_id: string;
  is_available: boolean;
}

interface AssignmentData {
  id: number;
  match_id: number;
  referee_id: number;
  status: string;
  assigned_by: number | null;
  assigned_at: string | null;
}

const getMonthOptions = () => {
  const months = [];
  const currentDate = new Date();
  for (let i = -1; i <= 6; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    months.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: nl })
    });
  }
  return months;
};

interface AvailabilityMatrixProps {
  /** Verberg de header (maand-selector + refresh + counter) — handig wanneer parent al een toolbar heeft */
  hideHeader?: boolean;
  /** Externe maand-controle */
  selectedMonth?: string;
  onSelectedMonthChange?: (month: string) => void;
}

const AvailabilityMatrix: React.FC<AvailabilityMatrixProps> = ({
  hideHeader = false,
  selectedMonth: externalMonth,
  onSelectedMonthChange,
}) => {
  const { user } = useAuth();
  const [internalMonth, setInternalMonth] = useState(format(new Date(), 'yyyy-MM'));
  const selectedMonth = externalMonth ?? internalMonth;
  const setSelectedMonth = (m: string) => {
    if (onSelectedMonthChange) onSelectedMonthChange(m);
    else setInternalMonth(m);
  };

  const [referees, setReferees] = useState<RefereeInfo[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [availability, setAvailability] = useState<AvailabilityData[]>([]);
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [usersById, setUsersById] = useState<Map<number, string>>(new Map());
  const [monthCounts, setMonthCounts] = useState<Map<number, number>>(new Map());
  const [seasonCounts, setSeasonCounts] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyResponded, setOnlyResponded] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [year, monthNum] = selectedMonth.split('-').map(Number);
      const nextMonth = monthNum === 12
        ? `${year + 1}-01`
        : `${year}-${String(monthNum + 1).padStart(2, '0')}`;

      const [matchesRes, refereesRes, availRes, assignRes] = await Promise.all([
        supabase
          .from('matches')
          .select('match_id, match_date, location, home_team_id, away_team_id, assigned_referee_id')
          .gte('match_date', `${selectedMonth}-01`)
          .lt('match_date', `${nextMonth}-01`)
          .order('match_date', { ascending: true }),
        supabase
          .from('users')
          .select('user_id, username')
          .eq('role', 'referee')
          .order('username'),
        supabase
          .from('referee_availability')
          .select('user_id, match_id, poll_group_id, is_available')
          .eq('poll_month', selectedMonth),
        supabase
          .from('referee_assignments' as any)
          .select('id, match_id, referee_id, status') as any
      ]);

      if (matchesRes.error) throw matchesRes.error;

      const matchesData = matchesRes.data || [];
      const refereesData = (refereesRes.data || []) as RefereeInfo[];
      const availData = (availRes.data || []) as AvailabilityData[];

      const matchIds = new Set(matchesData.map(m => m.match_id));
      const allAssignments = (assignRes.data || []) as AssignmentData[];
      const monthAssignments = allAssignments.filter(a => matchIds.has(a.match_id));

      const teamIds = new Set<number>();
      matchesData.forEach(m => {
        if (m.home_team_id) teamIds.add(m.home_team_id);
        if (m.away_team_id) teamIds.add(m.away_team_id);
      });

      const { data: teams } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .in('team_id', Array.from(teamIds));

      const teamMap = new Map(teams?.map(t => [t.team_id, t.team_name]) || []);

      const sessionMap = new Map<string, Session>();
      matchesData.forEach(m => {
        const dateOnly = m.match_date.split('T')[0];
        const loc = m.location || 'Onbekend';
        const key = `${dateOnly}__${loc}`;

        if (!sessionMap.has(key)) {
          sessionMap.set(key, {
            key,
            date: m.match_date,
            dateOnly,
            location: loc,
            matches: []
          });
        }
        sessionMap.get(key)!.matches.push({
          ...m,
          home_team_name: teamMap.get(m.home_team_id!) || '?',
          away_team_name: teamMap.get(m.away_team_id!) || '?'
        });
      });

      const sortedSessions = Array.from(sessionMap.values()).sort((a, b) => {
        const dc = a.dateOnly.localeCompare(b.dateOnly);
        if (dc !== 0) return dc;
        return getLocationOrder(a.location) - getLocationOrder(b.location);
      });

      setReferees(refereesData);
      setSessions(sortedSessions);
      setAvailability(availData);
      setAssignments(monthAssignments);

      // Workload stats voor auto-suggest
      const { monthCounts: mc, seasonCounts: sc } = await fetchWorkloadStats(selectedMonth);
      setMonthCounts(mc);
      setSeasonCounts(sc);
    } catch (error) {
      console.error('Error fetching matrix data:', error);
      toast.error('Fout bij ophalen gegevens');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isRefereeAvailable = useCallback((session: Session, refereeId: number): boolean => {
    for (const match of session.matches) {
      const avail = availability.find(a => a.user_id === refereeId && a.match_id === match.match_id);
      if (avail) return avail.is_available;
    }
    const pollGroupId = `${selectedMonth}_${session.matches[0]?.match_id || 'general'}`;
    const byGroup = availability.find(a => a.user_id === refereeId && a.poll_group_id === pollGroupId);
    if (byGroup) return byGroup.is_available;
    return false;
  }, [availability, selectedMonth]);

  const hasRefereeResponded = useCallback((session: Session, refereeId: number): boolean => {
    if (session.matches.some(m =>
      availability.some(a => a.user_id === refereeId && a.match_id === m.match_id)
    )) return true;
    const pollGroupId = `${selectedMonth}_${session.matches[0]?.match_id || 'general'}`;
    return availability.some(a => a.user_id === refereeId && a.poll_group_id === pollGroupId);
  }, [availability, selectedMonth]);

  const getSessionAssignment = useCallback((session: Session, refereeId: number): AssignmentData | null => {
    for (const match of session.matches) {
      const assignment = assignments.find(a => a.match_id === match.match_id && a.referee_id === refereeId);
      if (assignment) return assignment;
    }
    return null;
  }, [assignments]);

  const getSessionAssignedReferee = useCallback((session: Session): number | null => {
    for (const match of session.matches) {
      if (match.assigned_referee_id) return match.assigned_referee_id;
      const assignment = assignments.find(a => a.match_id === match.match_id && a.status !== 'declined' && a.status !== 'cancelled');
      if (assignment) return assignment.referee_id;
    }
    return null;
  }, [assignments]);

  // Wijs een ref toe aan de eerste niet-toegewezen wedstrijd in de sessie.
  // Als showUndo true is, toont een 5s undo-toast.
  const assignToSessionInternal = async (
    session: Session,
    refereeId: number,
    refereeName: string,
    showUndo: boolean,
  ): Promise<{ assignmentId?: number; ok: boolean }> => {
    const targetMatch = session.matches.find((m) => !m.assigned_referee_id);
    if (!targetMatch) {
      toast.error('Alle wedstrijden in deze sessie zijn al toegewezen');
      return { ok: false };
    }
    const userId = user?.id || 0;
    const result = await assignmentService.assignReferee(
      { match_id: targetMatch.match_id, referee_id: refereeId },
      userId,
    );
    if (!result.success) {
      toast.error(result.error || 'Toewijzing mislukt');
      return { ok: false };
    }
    // Haal nieuw aangemaakte assignment id terug om undo te kunnen doen
    const fresh = await assignmentService.getAssignmentForMatch(targetMatch.match_id);
    if (showUndo && fresh) {
      toast.success(`${refereeName} toegewezen`, {
        description: formatDateWithDay(session.date) + ' · ' + session.location,
        action: {
          label: 'Ongedaan maken',
          onClick: async () => {
            const ok = await assignmentService.removeAssignment(fresh.id, user?.id);
            if (ok) {
              toast.success('Toewijzing teruggedraaid');
              await fetchData();
            } else {
              toast.error('Kon toewijzing niet ongedaan maken');
            }
          },
        },
        duration: 5000,
      });
    }
    return { ok: true, assignmentId: fresh?.id };
  };

  const handleAssign = async (session: Session, refereeId: number) => {
    const targetMatch = session.matches.find((m) => !m.assigned_referee_id);
    if (!targetMatch) {
      toast.error('Alle wedstrijden in deze sessie zijn al toegewezen');
      return;
    }
    const refName = referees.find((r) => r.user_id === refereeId)?.username || 'Scheidsrechter';
    const cellKey = `${targetMatch.match_id}-${refereeId}`;
    setAssigning(cellKey);
    try {
      await assignToSessionInternal(session, refereeId, refName, true);
      await fetchData();
    } catch {
      toast.error('Onverwachte fout');
    } finally {
      setAssigning(null);
    }
  };

  const handleRemove = async (assignment: AssignmentData) => {
    setAssigning(`${assignment.match_id}-${assignment.referee_id}`);
    try {
      const success = await assignmentService.removeAssignment(assignment.id, user?.id);
      if (success) {
        toast.success('Toewijzing verwijderd');
        await fetchData();
      } else {
        toast.error('Kon toewijzing niet verwijderen');
      }
    } catch {
      toast.error('Onverwachte fout');
    } finally {
      setAssigning(null);
    }
  };

  // Suggest: top kandidaat voor één sessie
  const getSuggestionForSession = useCallback(
    (session: Session): SuggestionCandidate | null => {
      if (getSessionAssignedReferee(session) !== null) return null;
      const list = suggestRefereesForSession({
        session: {
          sessionKey: session.key,
          matchIds: session.matches.map((m) => m.match_id),
          dateOnly: session.dateOnly,
        },
        referees,
        availability,
        assignments,
        pollMonth: selectedMonth,
        monthCounts,
        seasonCounts,
      });
      return list[0] || null;
    },
    [referees, availability, assignments, selectedMonth, monthCounts, seasonCounts, getSessionAssignedReferee],
  );

  const handleSuggestForSession = async (session: Session) => {
    const top = getSuggestionForSession(session);
    if (!top) {
      toast.error('Geen geschikte scheidsrechter gevonden', {
        description: 'Geen beschikbare ref of allemaal al ingezet',
      });
      return;
    }
    await handleAssign(session, top.user_id);
  };

  // Bulk: wijs alle nog-open sessies toe aan hun beste kandidaat,
  // met workload-spreiding (telling wordt incrementeel bijgewerkt).
  const handleBulkAutoAssign = async () => {
    setBulkAssigning(true);
    try {
      const openSessions = sessions.filter(
        (s) => getSessionAssignedReferee(s) === null,
      );
      if (openSessions.length === 0) {
        toast.info('Alle sessies zijn al toegewezen');
        return;
      }

      // Lokale kopie van counts zodat spreiding ook intra-bulk geldt
      const localMonth = new Map(monthCounts);
      const localSeason = new Map(seasonCounts);
      const usedOnDate = new Map<string, Set<number>>(); // dateOnly -> refIds

      let assigned = 0;
      let skipped = 0;

      for (const session of openSessions) {
        const list = suggestRefereesForSession({
          session: {
            sessionKey: session.key,
            matchIds: session.matches.map((m) => m.match_id),
            dateOnly: session.dateOnly,
          },
          referees,
          availability,
          assignments,
          pollMonth: selectedMonth,
          monthCounts: localMonth,
          seasonCounts: localSeason,
        });

        const dayUsed = usedOnDate.get(session.dateOnly) || new Set<number>();
        const top = list.find((c) => !dayUsed.has(c.user_id));
        if (!top) {
          skipped++;
          continue;
        }

        const refName = referees.find((r) => r.user_id === top.user_id)?.username || '';
        const result = await assignToSessionInternal(session, top.user_id, refName, false);
        if (result.ok) {
          assigned++;
          localMonth.set(top.user_id, (localMonth.get(top.user_id) || 0) + 1);
          localSeason.set(top.user_id, (localSeason.get(top.user_id) || 0) + 1);
          dayUsed.add(top.user_id);
          usedOnDate.set(session.dateOnly, dayUsed);
        } else {
          skipped++;
        }
      }

      if (assigned > 0) {
        toast.success(`${assigned} toewijzing${assigned === 1 ? '' : 'en'} aangemaakt`, {
          description: skipped > 0 ? `${skipped} sessie(s) overgeslagen — geen kandidaat` : undefined,
        });
        await fetchData();
      } else {
        toast.warning('Geen sessies konden automatisch toegewezen worden');
      }
    } catch (e) {
      console.error('Bulk assign error:', e);
      toast.error('Onverwachte fout bij auto-toewijzen');
    } finally {
      setBulkAssigning(false);
    }
  };

  const openSessionsCount = useMemo(
    () => sessions.filter((s) => getSessionAssignedReferee(s) === null).length,
    [sessions, getSessionAssignedReferee],
  );

  const totalSessions = sessions.length;
  const assignedSessions = sessions.filter(s => getSessionAssignedReferee(s) !== null).length;

  if (loading) {
    return (
      <div className="space-y-4">
        {!hideHeader && (
          <div className="flex gap-2 items-center">
            <Skeleton className="h-10 w-[160px]" />
            <Skeleton className="h-10 w-10" />
          </div>
        )}
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <Badge variant="outline">{assignedSessions}/{totalSessions} sessies toegewezen</Badge>
        </div>
      )}

      {/* Auto-toewijs actiebalk */}
      {sessions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-foreground font-medium">
              {openSessionsCount === 0
                ? 'Alle sessies zijn toegewezen'
                : `${openSessionsCount} open sessie${openSessionsCount === 1 ? '' : 's'}`}
            </span>
            {openSessionsCount > 0 && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                · suggesties op basis van beschikbaarheid + workload-spreiding
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleBulkAutoAssign}
            disabled={bulkAssigning || openSessionsCount === 0}
            className="gap-1.5"
          >
            {bulkAssigning ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            Auto-toewijzen
          </Button>
        </div>
      )}

      {/* Workload-overzicht */}
      {referees.length > 0 && (
        <div className="rounded-lg border border-border bg-card px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-foreground">Workload deze maand</div>
            <div className="text-xs text-muted-foreground">aantal toewijzingen per ref</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[...referees]
              .sort((a, b) => (monthCounts.get(a.user_id) || 0) - (monthCounts.get(b.user_id) || 0))
              .map((ref) => {
                const count = monthCounts.get(ref.user_id) || 0;
                const max = Math.max(1, ...Array.from(monthCounts.values()));
                const intensity = count === 0 ? 0 : count / max;
                return (
                  <span
                    key={ref.user_id}
                    className="workload-chip inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
                    style={{
                      backgroundColor: count === 0
                        ? 'hsl(var(--muted) / 0.3)'
                        : `hsl(var(--primary) / ${0.08 + intensity * 0.22})`,
                    }}
                    title={`${ref.username}: ${count} deze maand · ${seasonCounts.get(ref.user_id) || 0} dit seizoen`}
                  >
                    <span>{ref.username}</span>
                    <span className="workload-count font-mono">{count}</span>
                  </span>
                );
              })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs items-center bg-muted/30 px-3 py-2 rounded-lg border border-border/50">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-success flex items-center justify-center shadow-sm">
            <Star className="h-3 w-3 text-white fill-white" />
          </div>
          <span className="text-foreground font-medium">Toegewezen</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-success/15 border border-success/40 flex items-center justify-center">
            <Check className="h-3 w-3 text-success" />
          </div>
          <span className="text-foreground">Beschikbaar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-muted border border-border flex items-center justify-center">
            <X className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="text-foreground">Niet beschikbaar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-card border border-dashed border-border flex items-center justify-center">
            <Minus className="h-3 w-3 text-muted-foreground/60" />
          </div>
          <span className="text-foreground">Geen reactie</span>
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Geen wedstrijden gevonden voor deze maand</p>
          </CardContent>
        </Card>
      ) : (
        <TooltipProvider delayDuration={200}>
          {/* Desktop Matrix */}
          <div className="hidden md:block rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-auto max-h-[70vh]">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-muted">
                    <th className="sticky left-0 z-30 bg-muted text-left px-4 py-3 font-semibold min-w-[260px] border-r border-b border-border text-foreground">
                      Sessie
                    </th>
                    {referees.map(ref => (
                      <th
                        key={ref.user_id}
                        className="px-2 py-3 text-center font-semibold min-w-[110px] border-r border-b border-border last:border-r-0 text-foreground bg-muted"
                      >
                        <div className="text-xs leading-tight" title={ref.username}>
                          {ref.username}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, sessionIdx) => {
                    const assignedRefId = getSessionAssignedReferee(session);
                    const rowBg = sessionIdx % 2 === 0 ? 'bg-card' : 'bg-muted/20';
                    return (
                      <tr key={session.key} className={`${rowBg} hover:bg-primary/5 transition-colors`}>
                        <td className={`sticky left-0 z-10 ${rowBg} px-4 py-3 border-r border-t border-border align-top`}>
                          <div className="font-semibold text-foreground text-sm">
                            {formatDateWithDay(session.date)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                            {session.location} · {formatTimeForDisplay(session.date)}
                          </div>
                          <div className="text-xs text-muted-foreground/80 mt-1.5 leading-relaxed">
                            {session.matches.map(m => `${m.home_team_name} – ${m.away_team_name}`).join(' · ')}
                          </div>
                          {assignedRefId === null && (() => {
                            const top = getSuggestionForSession(session);
                            return (
                              <div className="mt-2 flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs gap-1"
                                  disabled={!top || assigning !== null}
                                  onClick={() => handleSuggestForSession(session)}
                                >
                                  <Sparkles className="h-3 w-3" />
                                  {top ? `Suggereer: ${top.username}` : 'Geen suggestie'}
                                </Button>
                                {top && (
                                  <span className="text-xs font-medium" style={{ color: 'var(--color-700)' }} title={top.reason}>
                                    {top.monthCount}× deze maand
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        {referees.map(ref => {
                          const available = isRefereeAvailable(session, ref.user_id);
                          const hasResponded = hasRefereeResponded(session, ref.user_id);
                          const assignment = getSessionAssignment(session, ref.user_id);
                          const isAssigned = !!assignment;
                          const isOtherAssigned = assignedRefId !== null && assignedRefId !== ref.user_id;
                          const cellKey = `${session.matches[0]?.match_id}-${ref.user_id}`;
                          const isLoading = assigning === cellKey;

                          let cellClass = 'bg-card border border-dashed border-border';
                          let cellContent: React.ReactNode = (
                            <Minus className="h-3.5 w-3.5 mx-auto text-muted-foreground/40" />
                          );
                          let tooltipText = `${ref.username} – Geen reactie`;
                          let clickable = false;

                          if (isAssigned) {
                            cellClass = 'bg-success hover:bg-success/90 cursor-pointer ring-2 ring-success/30 ring-inset';
                            cellContent = <Star className="h-4 w-4 mx-auto text-white fill-white" />;
                            tooltipText = `${ref.username} – Toegewezen · Klik om te verwijderen`;
                            clickable = true;
                          } else if (isOtherAssigned) {
                            cellClass = 'bg-muted/40 opacity-50';
                            cellContent = available ? (
                              <Check className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                            ) : hasResponded ? (
                              <X className="h-3.5 w-3.5 mx-auto text-muted-foreground/60" />
                            ) : (
                              <Minus className="h-3.5 w-3.5 mx-auto text-muted-foreground/40" />
                            );
                            tooltipText = `${ref.username} – Andere scheidsrechter al toegewezen`;
                          } else if (available) {
                            cellClass = 'bg-success/15 hover:bg-success/30 cursor-pointer border border-success/40';
                            cellContent = <Check className="h-4 w-4 mx-auto text-success" />;
                            tooltipText = `${ref.username} – Beschikbaar · Klik om toe te wijzen`;
                            clickable = true;
                          } else if (hasResponded) {
                            cellClass = 'bg-muted/50 border border-border';
                            cellContent = <X className="h-3.5 w-3.5 mx-auto text-muted-foreground" />;
                            tooltipText = `${ref.username} – Niet beschikbaar`;
                          }

                          if (isLoading) {
                            cellContent = <RefreshCw className="h-4 w-4 mx-auto animate-spin text-foreground" />;
                          }

                          return (
                            <td
                              key={ref.user_id}
                              className="border-r border-t border-border last:border-r-0 p-1"
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    role={clickable ? 'button' : undefined}
                                    aria-pressed={clickable ? isAssigned : undefined}
                                    aria-label={tooltipText}
                                    tabIndex={clickable ? 0 : -1}
                                    className={`h-10 rounded-md flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${cellClass}`}
                                    onClick={() => {
                                      if (isLoading || !clickable) return;
                                      if (isAssigned && assignment) {
                                        handleRemove(assignment);
                                      } else if (available && !isOtherAssigned) {
                                        handleAssign(session, ref.user_id);
                                      }
                                    }}
                                  >
                                    {cellContent}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {tooltipText}
                                </TooltipContent>
                              </Tooltip>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: Card per session */}
          <div className="md:hidden space-y-3">
            {sessions.map((session) => {
              const assignedRefId = getSessionAssignedReferee(session);
              return (
                <Card key={session.key}>
                  <CardContent className="p-3 space-y-2">
                    <div>
                      <div className="font-semibold text-sm">{formatDateWithDay(session.date)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                        {session.location} · {formatTimeForDisplay(session.date)}
                      </div>
                      <div className="text-xs text-muted-foreground/80 mt-1">
                        {session.matches.map(m => `${m.home_team_name} – ${m.away_team_name}`).join(' · ')}
                      </div>
                      {assignedRefId === null && (() => {
                        const top = getSuggestionForSession(session);
                        if (!top) return null;
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1 mt-2 w-full justify-center"
                            disabled={assigning !== null}
                            onClick={() => handleSuggestForSession(session)}
                          >
                            <Sparkles className="h-3 w-3" />
                            Suggereer: {top.username} ({top.monthCount}×)
                          </Button>
                        );
                      })()}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {referees.map(ref => {
                        const available = isRefereeAvailable(session, ref.user_id);
                        const assignment = getSessionAssignment(session, ref.user_id);
                        const isAssigned = !!assignment;
                        const isOtherAssigned = assignedRefId !== null && assignedRefId !== ref.user_id;
                        const cellKey = `${session.matches[0]?.match_id}-${ref.user_id}`;
                        const isLoadingCell = assigning === cellKey;

                        if (!available && !isAssigned) return null;

                        return (
                          <button
                            key={ref.user_id}
                            disabled={isLoadingCell || (isOtherAssigned && !isAssigned)}
                            onClick={() => {
                              if (isAssigned && assignment) handleRemove(assignment);
                              else if (available) handleAssign(session, ref.user_id);
                            }}
                            className={`
                              inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium
                              transition-all min-h-[32px]
                              ${isAssigned
                                ? 'pill-success-strong shadow-sm'
                                : 'bg-success/15 border border-success/40'
                              }
                              ${isOtherAssigned && !isAssigned ? 'opacity-40' : ''}
                              disabled:cursor-not-allowed
                            `}
                          >
                            {isLoadingCell ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : isAssigned ? (
                              <Star className="h-3 w-3 fill-white" />
                            ) : null}
                            {ref.username}
                          </button>
                        );
                      })}
                      {referees.every(ref => !isRefereeAvailable(session, ref.user_id) && !getSessionAssignment(session, ref.user_id)) && (
                        <span className="text-xs text-muted-foreground italic">Geen beschikbaarheid</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
};

export default AvailabilityMatrix;
