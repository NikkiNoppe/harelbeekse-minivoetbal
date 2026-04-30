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
          .select('id, match_id, referee_id, status, assigned_by, assigned_at') as any
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

      // Bouw users-by-id map: referees + assigners (voor audit-tooltip)
      const userIds = new Set<number>(refereesData.map((r) => r.user_id));
      monthAssignments.forEach((a) => {
        if (a.assigned_by) userIds.add(a.assigned_by);
      });
      if (userIds.size > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('user_id, username')
          .in('user_id', Array.from(userIds));
        const map = new Map<number, string>();
        (usersData || []).forEach((u: any) => map.set(u.user_id, u.username));
        setUsersById(map);
      } else {
        setUsersById(new Map());
      }

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

      // Verzamel nieuw aangemaakte assignment-IDs voor één gegroepeerde undo
      const createdIds: number[] = [];

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
          if (result.assignmentId) createdIds.push(result.assignmentId);
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
          duration: 10000,
          action:
            createdIds.length > 0
              ? {
                  label: 'Alles ongedaan',
                  onClick: async () => {
                    const results = await Promise.all(
                      createdIds.map((id) => assignmentService.removeAssignment(id, user?.id)),
                    );
                    const undone = results.filter(Boolean).length;
                    if (undone > 0) {
                      toast.success(`${undone} toewijzing${undone === 1 ? '' : 'en'} teruggedraaid`);
                      await fetchData();
                    } else {
                      toast.error('Kon toewijzingen niet ongedaan maken');
                    }
                  },
                }
              : undefined,
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

  // ─── FILTERS ───────────────────────────────────────────────────────────
  // Per-sessie: heeft een gegeven ref gereageerd?
  const respondedSet = useMemo(() => {
    const set = new Set<number>();
    availability.forEach((a) => set.add(a.user_id));
    return set;
  }, [availability]);

  const filteredReferees = useMemo(() => {
    let list = referees;
    const q = searchTerm.trim().toLowerCase();
    if (q) list = list.filter((r) => r.username.toLowerCase().includes(q));
    if (onlyResponded) list = list.filter((r) => respondedSet.has(r.user_id));
    return list;
  }, [referees, searchTerm, onlyResponded, respondedSet]);

  // ─── EXPORT ────────────────────────────────────────────────────────────
  const buildAssignedEvents = useCallback((): ICalEvent[] => {
    const events: ICalEvent[] = [];
    sessions.forEach((session) => {
      const assignedRefId = getSessionAssignedReferee(session);
      if (!assignedRefId) return;
      const refName = referees.find((r) => r.user_id === assignedRefId)?.username || 'Scheidsrechter';
      session.matches.forEach((m) => {
        const dateOnly = m.match_date.split('T')[0];
        const time = formatTimeForDisplay(m.match_date);
        events.push({
          id: m.match_id,
          title: `${m.home_team_name} – ${m.away_team_name} (ref: ${refName})`,
          date: dateOnly,
          time,
          location: session.location,
          description: `Scheidsrechter: ${refName}`,
          duration: 60,
        });
      });
    });
    return events;
  }, [sessions, referees, getSessionAssignedReferee]);

  const handleExportICS = () => {
    const events = buildAssignedEvents();
    if (events.length === 0) {
      toast.info('Geen toegewezen wedstrijden om te exporteren');
      return;
    }
    const ok = downloadICalFile(events, `scheidsrechters-${selectedMonth}`, `Scheidsrechters ${selectedMonth}`);
    if (ok) toast.success(`${events.length} wedstrijd${events.length === 1 ? '' : 'en'} geëxporteerd (ICS)`);
    else toast.error('Export mislukt');
  };

  const handleExportCSV = () => {
    const events = buildAssignedEvents();
    if (events.length === 0) {
      toast.info('Geen toegewezen wedstrijden om te exporteren');
      return;
    }
    const ok = downloadCSVFile(events, `scheidsrechters-${selectedMonth}`);
    if (ok) toast.success(`${events.length} wedstrijd${events.length === 1 ? '' : 'en'} geëxporteerd (CSV)`);
    else toast.error('Export mislukt');
  };


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

      {/* Filter & export bar */}
      {referees.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between rounded-lg border border-[hsl(var(--color-200))] bg-card px-3 py-2">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Zoek scheidsrechter…"
                className="pl-8 h-8 text-sm"
                aria-label="Zoek scheidsrechter"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="only-responded"
                checked={onlyResponded}
                onCheckedChange={setOnlyResponded}
              />
              <Label htmlFor="only-responded" className="text-xs cursor-pointer flex items-center gap-1">
                <FilterIcon className="h-3 w-3" />
                Alleen wie reageerde
              </Label>
            </div>
            {(searchTerm || onlyResponded) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setSearchTerm('');
                  setOnlyResponded(false);
                }}
              >
                <Undo2 className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto sm:ml-0">
              {filteredReferees.length}/{referees.length} refs zichtbaar
            </span>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={handleExportICS}
              title="Exporteer toegewezen wedstrijden als iCal-bestand"
            >
              <Download className="h-3.5 w-3.5" />
              ICS
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={handleExportCSV}
              title="Exporteer toegewezen wedstrijden als CSV-bestand"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          </div>
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
          <span className="text-foreground">Geen reactie <span className="text-muted-foreground">(klikbaar)</span></span>
        </div>
        <div className="ml-auto text-xs text-muted-foreground italic">
          Tip: klik op elke cel om handmatig toe te wijzen
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
                    <th className="sticky left-0 z-30 bg-muted text-left px-4 py-3 font-semibold min-w-[260px] border-r border-b border-border text-foreground align-bottom">
                      Sessie
                    </th>
                    {filteredReferees.map(ref => (
                      <th
                        key={ref.user_id}
                        className="px-1 py-2 font-semibold w-10 min-w-[40px] max-w-[40px] border-r border-b border-border last:border-r-0 text-foreground bg-muted align-bottom h-40"
                      >
                        <div
                          className="text-xs leading-tight whitespace-nowrap mx-auto"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                          title={ref.username}
                        >
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
                          <div className="mt-1.5 flex flex-col gap-0.5">
                            {session.matches.map((m, i) => (
                              <div key={i} className="text-[10px] leading-tight text-muted-foreground/70">
                                {m.home_team_name} – {m.away_team_name}
                              </div>
                            ))}
                          </div>
                        </td>
                        {filteredReferees.map(ref => {
                          const available = isRefereeAvailable(session, ref.user_id);
                          const hasResponded = hasRefereeResponded(session, ref.user_id);
                          const assignment = getSessionAssignment(session, ref.user_id);
                          const isAssigned = !!assignment;
                          const isOtherAssigned = assignedRefId !== null && assignedRefId !== ref.user_id;
                          const cellKey = `${session.matches[0]?.match_id}-${ref.user_id}`;
                          const isLoading = assigning === cellKey;

                          // Default: "Geen reactie" — admin kan toch handmatig toewijzen.
                          let cellClass = 'bg-card hover:bg-primary/10 cursor-pointer border border-dashed border-border';
                          let cellContent: React.ReactNode = (
                            <Minus className="h-3.5 w-3.5 mx-auto text-muted-foreground/60" />
                          );
                          let tooltipText = `${ref.username} – Geen reactie · Klik om handmatig toe te wijzen`;
                          let clickable = true;
                          let forceAssign = true;

                          if (isAssigned) {
                            cellClass = 'bg-success hover:bg-success/90 cursor-pointer ring-2 ring-success/30 ring-inset';
                            cellContent = <Star className="h-4 w-4 mx-auto text-white fill-white" />;
                            tooltipText = (() => {
                              const assignerName = assignment?.assigned_by ? usersById.get(assignment.assigned_by) : null;
                              const whenStr = assignment?.assigned_at
                                ? format(new Date(assignment.assigned_at), 'd MMM HH:mm', { locale: nl })
                                : null;
                              const parts: string[] = [];
                              if (assignerName) parts.push(`door ${assignerName}`);
                              if (whenStr) parts.push(`op ${whenStr}`);
                              const suffix = parts.length ? ` · ${parts.join(' ')}` : '';
                              return `${ref.username} – Toegewezen${suffix} · Klik om te verwijderen`;
                            })();
                            clickable = true;
                            forceAssign = false;
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
                            clickable = false;
                            forceAssign = false;
                          } else if (available) {
                            cellClass = 'bg-success/15 hover:bg-success/30 cursor-pointer border border-success/40';
                            cellContent = <Check className="h-4 w-4 mx-auto text-success" />;
                            tooltipText = `${ref.username} – Beschikbaar · Klik om toe te wijzen`;
                            clickable = true;
                            forceAssign = false;
                          } else if (hasResponded) {
                            // Ref is expliciet niet-beschikbaar — admin kan met waarschuwing toch toewijzen.
                            cellClass = 'bg-destructive/5 hover:bg-destructive/15 cursor-pointer border border-destructive/30';
                            cellContent = <X className="h-3.5 w-3.5 mx-auto text-destructive/70" />;
                            tooltipText = `${ref.username} – Niet beschikbaar · Klik om alsnog toe te wijzen`;
                            clickable = true;
                            forceAssign = true;
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
                                      if (isLoading || !clickable || isOtherAssigned) return;
                                      if (isAssigned && assignment) {
                                        handleRemove(assignment);
                                        return;
                                      }
                                      if (forceAssign && hasResponded && !available) {
                                        // Expliciet niet-beschikbaar — vraag bevestiging.
                                        const ok = window.confirm(
                                          `${ref.username} heeft aangegeven NIET beschikbaar te zijn voor deze sessie.\n\nToch toewijzen?`
                                        );
                                        if (!ok) return;
                                      }
                                      handleAssign(session, ref.user_id);
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
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {filteredReferees.map(ref => {
                        const available = isRefereeAvailable(session, ref.user_id);
                        const hasResponded = hasRefereeResponded(session, ref.user_id);
                        const assignment = getSessionAssignment(session, ref.user_id);
                        const isAssigned = !!assignment;
                        const isOtherAssigned = assignedRefId !== null && assignedRefId !== ref.user_id;
                        const cellKey = `${session.matches[0]?.match_id}-${ref.user_id}`;
                        const isLoadingCell = assigning === cellKey;

                        // Pill-stijl op basis van status
                        let pillClass = 'bg-card border border-dashed border-border text-muted-foreground'; // geen reactie
                        if (isAssigned) pillClass = 'pill-success-strong shadow-sm';
                        else if (available) pillClass = 'bg-success/15 border border-success/40 text-foreground';
                        else if (hasResponded) pillClass = 'bg-destructive/5 border border-destructive/30 text-foreground';

                        return (
                          <button
                            key={ref.user_id}
                            disabled={isLoadingCell || (isOtherAssigned && !isAssigned)}
                            onClick={() => {
                              if (isAssigned && assignment) {
                                handleRemove(assignment);
                                return;
                              }
                              if (isOtherAssigned) return;
                              if (hasResponded && !available) {
                                const ok = window.confirm(
                                  `${ref.username} gaf NIET beschikbaar op. Toch toewijzen?`
                                );
                                if (!ok) return;
                              }
                              handleAssign(session, ref.user_id);
                            }}
                            className={`
                              inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium
                              transition-all min-h-[32px]
                              ${pillClass}
                              ${isOtherAssigned && !isAssigned ? 'opacity-40' : ''}
                              disabled:cursor-not-allowed
                            `}
                          >
                            {isLoadingCell ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : isAssigned ? (
                              <Star className="h-3 w-3 fill-white" />
                            ) : !hasResponded ? (
                              <Minus className="h-3 w-3 opacity-60" />
                            ) : !available ? (
                              <X className="h-3 w-3 opacity-60" />
                            ) : null}
                            {ref.username}
                          </button>
                        );
                      })}
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
