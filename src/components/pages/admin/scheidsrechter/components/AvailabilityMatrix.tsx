import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  RefreshCw,
  Check,
  X,
  Star,
  Minus,
  Wand2,
  ChevronDown,
  Copy,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { getRpcSessionArgs } from '@/lib/authSession';
import { supabase } from '@/integrations/supabase/client';
import { assignmentService } from '@/services/scheidsrechter/assignmentService';
import {
  fetchRefereeAssignmentsForSession,
  fetchRefereeAvailabilityForSession,
  fetchRefereesForSession,
  fetchScheidsScheduleForMonth,
} from '@/services/scheidsrechter/scheidsSessionFetch';
import {
  suggestRefereesForSession,
  fetchWorkloadStats,
  type SuggestionCandidate,
} from '@/services/scheidsrechter/autoSuggestService';
import { useAuth } from '@/hooks/useAuth';
import { formatDateWithDay, formatTimeForDisplay } from '@/lib/dateUtils';
import { getLocationOrder } from '@/lib/matchSortingUtils';

// Types
interface RefereeInfo {
  user_id: number;
  username: string;
}

interface AdminUserInfo {
  user_id: number;
  username: string;
  role: string;
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
  assigned_by: number | null;
  assigned_at: string | null;
}

type AdminAvailabilityStatus = boolean | null;

interface RefereeCopyMessage {
  refereeId: number;
  refereeName: string;
  text: string;
  assignmentCount: number;
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
  /** Optionele externe plek voor matrixacties, zoals Auto-toewijzen naast de maandselector. */
  toolbarContainer?: HTMLElement | null;
}

const SESSION_COLUMN_WIDTH = 220;
const REFEREE_COLUMN_WIDTH = 64;
const SESSION_ROW_HEIGHT = 76;

const formatSessionLocation = (location: string) => {
  const [place] = location.split(' - ');
  return place?.trim() || location;
};

/** Format de tijdrange van een sessie in UTC (zoals in de tabel), bv. "21u00-23u00". */
const formatSessionTimeRange = (isoDate: string, matchCount: number): string => {
  const start = new Date(isoDate);
  const durationMinutes = Math.max(matchCount, 1) * 60;
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getUTCHours()}u${String(d.getUTCMinutes()).padStart(2, '0')}`;
  return `${fmt(start)}-${fmt(end)}`;
};

const AvailabilityMatrix: React.FC<AvailabilityMatrixProps> = ({
  hideHeader = false,
  selectedMonth: externalMonth,
  onSelectedMonthChange,
  toolbarContainer,
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
  const [copyMessagesOpen, setCopyMessagesOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        throw new Error('Niet ingelogd');
      }

      const [scheduleRows, refereesList, assignmentRows, availRows, usersRes] = await Promise.all([
        fetchScheidsScheduleForMonth(selectedMonth),
        fetchRefereesForSession(),
        fetchRefereeAssignmentsForSession(selectedMonth),
        fetchRefereeAvailabilityForSession(selectedMonth),
        supabase.rpc('get_all_users_for_admin', getRpcSessionArgs()),
      ]);

      if (usersRes.error) throw usersRes.error;

      const availData: AvailabilityData[] = availRows.map((r) => ({
        user_id: r.user_id,
        match_id: r.match_id,
        poll_group_id: r.poll_group_id,
        is_available: r.is_available,
      }));

      const refereesData = refereesList
        .map((u) => ({ user_id: u.user_id, username: u.username }))
        .sort((a, b) => a.username.localeCompare(b.username));

      const allUsersData = (usersRes.data || []) as AdminUserInfo[];
      const monthAssignments: AssignmentData[] = assignmentRows.map((a) => ({
        id: a.id,
        match_id: a.match_id,
        referee_id: a.referee_id,
        assigned_by: a.assigned_by,
        assigned_at: a.assigned_at,
      }));

      const sessionMap = new Map<string, Session>();
      scheduleRows.forEach((m) => {
        const dateOnly = m.match_date.split('T')[0];
        const loc = m.location || 'Onbekend';
        const key = `${dateOnly}__${loc}`;

        if (!sessionMap.has(key)) {
          sessionMap.set(key, {
            key,
            date: m.match_date,
            dateOnly,
            location: loc,
            matches: [],
          });
        }
        sessionMap.get(key)!.matches.push({
          match_id: m.match_id,
          match_date: m.match_date,
          location: m.location,
          home_team_id: m.home_team_id,
          away_team_id: m.away_team_id,
          assigned_referee_id: m.assigned_referee_id,
          home_team_name: m.home_team_name || '?',
          away_team_name: m.away_team_name || '?',
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
        const map = new Map<number, string>();
        allUsersData
          .filter((u) => userIds.has(u.user_id))
          .forEach((u) => map.set(u.user_id, u.username));
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
  }, [selectedMonth, user?.id]);

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
      if (match.assigned_referee_id === refereeId) {
        return {
          id: -match.match_id,
          match_id: match.match_id,
          referee_id: refereeId,
          assigned_by: null,
          assigned_at: null,
        };
      }
    }
    return null;
  }, [assignments]);

  const getSessionAssignedReferee = useCallback((session: Session): number | null => {
    for (const match of session.matches) {
      if (match.assigned_referee_id) return match.assigned_referee_id;
      const assignment = assignments.find(a => a.match_id === match.match_id);
      if (assignment) return assignment.referee_id;
    }
    return null;
  }, [assignments]);

  const applyLocalSessionAssignment = useCallback((session: Session, refereeId: number) => {
    const matchIds = new Set(session.matches.map((match) => match.match_id));
    const assignedAt = new Date().toISOString();

    setSessions((current) =>
      current.map((item) =>
        item.key === session.key
          ? {
              ...item,
              matches: item.matches.map((match) => ({
                ...match,
                assigned_referee_id: refereeId,
              })),
            }
          : item
      )
    );

    setAssignments((current) => [
      ...current.filter((assignment) => !matchIds.has(assignment.match_id)),
      ...session.matches.map((match) => ({
        id: -match.match_id,
        match_id: match.match_id,
        referee_id: refereeId,
        assigned_by: user?.id ?? null,
        assigned_at: assignedAt,
      })),
    ]);
  }, [user?.id]);

  const clearLocalSessionAssignment = useCallback((session: Session) => {
    const matchIds = new Set(session.matches.map((match) => match.match_id));

    setSessions((current) =>
      current.map((item) =>
        item.key === session.key
          ? {
              ...item,
              matches: item.matches.map((match) => ({
                ...match,
                assigned_referee_id: null,
              })),
            }
          : item
      )
    );

    setAssignments((current) => current.filter((assignment) => !matchIds.has(assignment.match_id)));
  }, []);

  // Wijs een ref toe aan alle wedstrijden in dezelfde sessie (zelfde datum + locatie).
  // Als showUndo true is, toont een 5s undo-toast.
  const assignToSessionInternal = async (
    session: Session,
    refereeId: number,
    refereeName: string,
    showUndo: boolean,
  ): Promise<{ assignmentId?: number; anchorMatchId?: number; ok: boolean }> => {
    const targetMatch = session.matches.find((m) => !m.assigned_referee_id);
    if (!targetMatch) {
      toast.error('Alle wedstrijden in deze sessie zijn al toegewezen');
      return { ok: false };
    }
    const userId = user?.id || 0;
    const result = await assignmentService.assignRefereeToSession(
      targetMatch.match_id,
      refereeId,
      userId,
    );
    if (!result.success) {
      toast.error(result.error || 'Toewijzing mislukt');
      return { ok: false };
    }
    applyLocalSessionAssignment(session, refereeId);

    // Haal enkel voor undo een vers assignment op; gewone toewijzing blijft volledig lokaal.
    const fresh = showUndo
      ? await assignmentService.getAssignmentForMatch(targetMatch.match_id)
      : null;
    if (fresh) {
      toast.success(`${refereeName} toegewezen`, {
        description: formatDateWithDay(session.date) + ' · ' + session.location,
        action: {
          label: 'Ongedaan maken',
          onClick: async () => {
            const ok = await assignmentService.removeSessionAssignment(fresh.match_id, user?.id || 0);
            if (ok) {
              toast.success('Toewijzing teruggedraaid');
              clearLocalSessionAssignment(session);
            } else {
              toast.error('Kon toewijzing niet ongedaan maken');
            }
          },
        },
        duration: 5000,
      });
    }
    return { ok: true, assignmentId: fresh?.id, anchorMatchId: targetMatch.match_id };
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
      await assignToSessionInternal(session, refereeId, refName, false);
    } catch {
      toast.error('Onverwachte fout');
    } finally {
      setAssigning(null);
    }
  };

  const handleSetAvailabilityStatus = async (
    session: Session,
    refereeId: number,
    status: AdminAvailabilityStatus,
  ) => {
    const firstMatch = session.matches[0];
    if (!firstMatch) {
      toast.error('Geen wedstrijd gevonden voor deze sessie');
      return;
    }

    const adminUserId = user?.id;

    if (!adminUserId) {
      toast.error('Geen admin gebruiker gevonden');
      return;
    }

    const cellKey = `${firstMatch.match_id}-${refereeId}`;
    setAssigning(cellKey);
    try {
      const results = await Promise.all(
        session.matches.map((match) =>
          supabase.rpc('admin_set_referee_availability', {
            ...getRpcSessionArgs(),
            p_referee_id: refereeId,
            p_match_id: match.match_id,
            p_poll_group_id: `${selectedMonth}_${match.match_id}`,
            p_poll_month: selectedMonth,
            p_is_available: status,
            p_notes: status === null
              ? null
              : `Door admin als ${status ? 'beschikbaar' : 'niet beschikbaar'} gemarkeerd`,
          })
        )
      );

      const failed = results.find((result) => result.error);
      if (!failed) {
        setAvailability((current) => {
          const keys = new Set(session.matches.map((match) => `${refereeId}:${selectedMonth}_${match.match_id}`));
          const withoutSession = current.filter((item) => !keys.has(`${item.user_id}:${item.poll_group_id}`));

          if (status === null) return withoutSession;

          return [
            ...withoutSession,
            ...session.matches.map((match) => ({
              user_id: refereeId,
              match_id: match.match_id,
              poll_group_id: `${selectedMonth}_${match.match_id}`,
              is_available: status,
            })),
          ];
        });
      } else {
        console.error('Admin availability update failed:', failed.error);
        const errorMessage = String(failed.error?.message || '');
        if (failed.error?.code === 'PGRST202' || errorMessage.includes('admin_set_referee_availability')) {
          toast.error('Database-migratie ontbreekt', {
            description: 'Pas eerst de admin_set_referee_availability migratie toe in Supabase.',
          });
        } else {
          toast.error('Kon beschikbaarheid niet opslaan');
        }
      }
    } catch {
      toast.error('Onverwachte fout bij beschikbaar maken');
    } finally {
      setAssigning(null);
    }
  };

  const handleRemove = async (assignment: AssignmentData) => {
    const session = sessions.find((item) =>
      item.matches.some((match) => match.match_id === assignment.match_id)
    );
    setAssigning(`${assignment.match_id}-${assignment.referee_id}`);
    try {
      const success = await assignmentService.removeSessionAssignment(assignment.match_id, user?.id || 0);
      if (success) {
        if (session) {
          clearLocalSessionAssignment(session);
        }
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

      // Verzamel sessies voor één gegroepeerde undo
      const createdSessionMatchIds: number[] = [];
      const createdSessions: Session[] = [];

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
          if (result.anchorMatchId) createdSessionMatchIds.push(result.anchorMatchId);
          createdSessions.push(session);
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
            createdSessionMatchIds.length > 0
              ? {
                  label: 'Alles ongedaan',
                  onClick: async () => {
                    const results = await Promise.all(
                      createdSessionMatchIds.map((matchId) =>
                        assignmentService.removeSessionAssignment(matchId, user?.id || 0)
                      ),
                    );
                    const undone = results.filter(Boolean).length;
                    if (undone > 0) {
                      toast.success(`${undone} toewijzing${undone === 1 ? '' : 'en'} teruggedraaid`);
                      createdSessions.forEach(clearLocalSessionAssignment);
                    } else {
                      toast.error('Kon toewijzingen niet ongedaan maken');
                    }
                  },
                }
              : undefined,
        });
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
  const matrixMinWidth = SESSION_COLUMN_WIDTH + referees.length * REFEREE_COLUMN_WIDTH;
  const refereeCopyMessages = useMemo<RefereeCopyMessage[]>(() => {
    return referees.map((referee) => {
      const assignedSessionsForReferee = sessions.filter(
        (session) => getSessionAssignedReferee(session) === referee.user_id
      );
      const lines = assignedSessionsForReferee.map((session) => {
        const start = new Date(session.date);
        const dateText = format(
          new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())),
          'EEEE d MMMM yyyy',
          { locale: nl },
        );
        const range = formatSessionTimeRange(session.date, session.matches.length);
        return `${dateText} – ${formatSessionLocation(session.location)} – ${range}`;
      });

      return {
        refereeId: referee.user_id,
        refereeName: referee.username,
        assignmentCount: lines.length,
        text: [
          `Beste ${referee.username}, je wedstrijden voor komende maand zijn:`,
          lines.length > 0 ? lines.join('\n') : 'Geen wedstrijden gevonden.',
        ].join('\n'),
      };
    });
  }, [referees, sessions, getSessionAssignedReferee]);

  const allSessionsCopyMessage = useMemo(() => {
    const sortedSessions = [...sessions].sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      if (da !== db) return da - db;
      return formatSessionLocation(a.location).localeCompare(formatSessionLocation(b.location));
    });

    const lines = sortedSessions.map((session) => {
      const start = new Date(session.date);
      const dateText = format(
        new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())),
        'EEEE d MMMM yyyy',
        { locale: nl },
      );
      const range = formatSessionTimeRange(session.date, session.matches.length);
      return `${dateText} – ${formatSessionLocation(session.location)} – ${range}`;
    });

    const [year, monthNum] = selectedMonth.split('-').map(Number);
    const monthLabel = format(
      new Date(Date.UTC(year, (monthNum || 1) - 1, 1)),
      'MMMM yyyy',
      { locale: nl },
    );

    return {
      sessionCount: sortedSessions.length,
      text: [
        'Beste scheidsrechters, gelieve door te geven wanneer je beschikbaar bent.',
        '',
        `Overzicht speeldata voor ${monthLabel}:`,
        lines.length > 0 ? lines.join('\n') : 'Geen wedstrijden gevonden.',
      ].join('\n'),
    };
  }, [sessions, selectedMonth]);

  const autoAssignButton = sessions.length > 0 ? (
    <Button
      size="sm"
      onClick={handleBulkAutoAssign}
      disabled={bulkAssigning || openSessionsCount === 0 || referees.length === 0}
      className="btn btn--primary btn--sm h-10 !min-h-10 w-full min-w-0 gap-1.5 !rounded-md px-3 shadow-sm lg:w-auto"
      title={openSessionsCount === 0 ? 'Alle sessies zijn al toegewezen' : 'Wijs open sessies automatisch toe'}
    >
      {bulkAssigning ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Wand2 className="h-3.5 w-3.5" />
      )}
      Auto-toewijzen
    </Button>
  ) : null;

  const toolbarPortal = toolbarContainer && autoAssignButton
    ? createPortal(autoAssignButton, toolbarContainer)
    : null;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Tekst gekopieerd');
    } catch {
      toast.error('Kopiëren mislukt');
    }
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
      {toolbarPortal}

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
            {!toolbarContainer && autoAssignButton}
          </div>
          <Badge variant="outline">{assignedSessions}/{totalSessions} sessies toegewezen</Badge>
        </div>
      )}

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Geen wedstrijden gevonden voor deze maand</p>
          </CardContent>
        </Card>
      ) : referees.length === 0 ? (
        <Card className="border border-destructive/30 bg-destructive/5">
          <CardContent className="p-5">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Geen scheidsrechters gevonden</h3>
              <p className="text-sm text-muted-foreground">
                Er zijn wedstrijden voor deze maand, maar er zijn geen gebruikers met de rol scheidsrechter gevonden.
                Voeg eerst scheidsrechters toe voor je deze matrix kan gebruiken.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <TooltipProvider delayDuration={200}>
          {/* Desktop Matrix */}
          <div className="hidden md:block rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-auto max-h-[70vh]">
              <table
                className="w-full table-fixed text-sm border-collapse"
                style={{ minWidth: `${matrixMinWidth}px` }}
              >
                <colgroup>
                  <col style={{ width: SESSION_COLUMN_WIDTH }} />
                  {referees.map(ref => (
                    <col key={ref.user_id} style={{ width: REFEREE_COLUMN_WIDTH }} />
                  ))}
                </colgroup>
                <thead className="sticky top-0 z-20">
                  <tr className="bg-card">
                    <th
                      aria-label="Sessie"
                      className="sticky left-0 z-30 bg-card text-left px-2 py-2 font-semibold border-r border-b-2 border-[hsl(var(--color-200))] text-foreground align-middle shadow-[0_1px_0_hsl(var(--color-200))]"
                      style={{
                        width: SESSION_COLUMN_WIDTH,
                        minWidth: SESSION_COLUMN_WIDTH,
                      }}
                    >
                      <div className="mx-auto flex max-w-[180px] flex-col gap-1 text-[10px] leading-tight">
                        <div className="grid grid-cols-[16px_minmax(0,1fr)] items-center gap-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-success shadow-sm">
                            <Star className="h-2.5 w-2.5 fill-white text-white" />
                          </span>
                          <span className="truncate">Toegewezen</span>
                        </div>
                        <div className="grid grid-cols-[16px_minmax(0,1fr)] items-center gap-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded border border-success/40 bg-success/15">
                            <Check className="h-2.5 w-2.5 text-success" />
                          </span>
                          <span className="truncate">Beschikbaar</span>
                        </div>
                        <div className="grid grid-cols-[16px_minmax(0,1fr)] items-center gap-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded border border-border bg-muted">
                            <X className="h-2.5 w-2.5 text-muted-foreground" />
                          </span>
                          <span className="truncate">Niet beschikbaar</span>
                        </div>
                        <div className="grid grid-cols-[16px_minmax(0,1fr)] items-center gap-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded border border-dashed border-border bg-card">
                            <Minus className="h-2.5 w-2.5 text-muted-foreground/60" />
                          </span>
                          <span className="truncate">Geen reactie</span>
                        </div>
                        <div className="mt-1 border-t border-border/60 pt-1 text-[9px] font-normal italic text-muted-foreground">
                          Klik op een cel om handmatig toe te wijzen.
                        </div>
                      </div>
                    </th>
                    {referees.map(ref => (
                      <th
                        key={ref.user_id}
                        className="h-36 border-r border-b-2 border-[hsl(var(--color-200))] bg-card px-1 py-2 align-bottom font-semibold text-foreground shadow-[0_1px_0_hsl(var(--color-200))] last:border-r-0"
                        style={{
                          width: REFEREE_COLUMN_WIDTH,
                          minWidth: REFEREE_COLUMN_WIDTH,
                        }}
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
                      <tr
                        key={session.key}
                        className={`${rowBg} hover:bg-muted transition-colors`}
                        style={{ height: SESSION_ROW_HEIGHT }}
                      >
                        <td
                          className={`sticky left-0 z-10 ${rowBg} border-r border-t border-border p-0 align-middle`}
                          style={{
                            width: SESSION_COLUMN_WIDTH,
                            minWidth: SESSION_COLUMN_WIDTH,
                            height: SESSION_ROW_HEIGHT,
                          }}
                        >
                          <div className="flex h-full min-w-0 flex-col items-center justify-center px-2 py-2 text-center">
                            <div className="flex max-w-full min-w-0 items-center justify-center gap-1.5 text-xs font-semibold leading-tight text-foreground">
                              <span className="shrink-0">{formatDateWithDay(session.date)}</span>
                              <span className="h-1 w-1 shrink-0 rounded-full bg-primary" />
                              <span className="truncate">{formatSessionLocation(session.location)}</span>
                              <span className="h-1 w-1 shrink-0 rounded-full bg-primary" />
                              <span className="shrink-0">{formatTimeForDisplay(session.date)}</span>
                            </div>
                            <div className="mt-1.5 flex max-h-[28px] w-full flex-col items-center gap-0.5 overflow-hidden border-t border-border/60 pt-1.5">
                              {session.matches.map((m, i) => (
                                <div key={i} className="max-w-full truncate text-center text-[9px] leading-tight text-muted-foreground/70">
                                  {m.home_team_name} – {m.away_team_name}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                        {referees.map(ref => {
                          const available = isRefereeAvailable(session, ref.user_id);
                          const hasResponded = hasRefereeResponded(session, ref.user_id);
                          const assignment = getSessionAssignment(session, ref.user_id);
                          const isAssigned = !!assignment;
                          const isOtherAssigned = assignedRefId !== null && assignedRefId !== ref.user_id;
                          const cellKey = `${session.matches[0]?.match_id}-${ref.user_id}`;
                          const isLoading = assigning === cellKey;

                          // Default: "Geen reactie" — admin zet eerst beschikbaarheid, daarna pas toewijzen.
                          let cellClass = 'bg-card hover:bg-primary/10 cursor-pointer';
                          let cellContent: React.ReactNode = (
                            <Minus className="h-3.5 w-3.5 mx-auto text-muted-foreground/60" />
                          );
                          let tooltipText = `${ref.username} – Geen reactie · Klik om beschikbaar te zetten`;
                          let clickable = true;

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
                          } else if (available) {
                            cellClass = 'bg-success/15 hover:bg-success/30 cursor-pointer';
                            cellContent = <Check className="h-4 w-4 mx-auto text-success" />;
                            tooltipText = `${ref.username} – Beschikbaar · Klik om toe te wijzen`;
                            clickable = true;
                          } else if (hasResponded) {
                            // Ref is expliciet niet-beschikbaar — admin kan hem eerst beschikbaar zetten.
                            cellClass = 'bg-destructive/5 hover:bg-destructive/15 cursor-pointer';
                            cellContent = <X className="h-3.5 w-3.5 mx-auto text-destructive/70" />;
                            tooltipText = `${ref.username} – Niet beschikbaar · Klik om beschikbaar te zetten`;
                            clickable = true;
                          }

                          if (isLoading) {
                            cellContent = <RefreshCw className="h-4 w-4 mx-auto animate-spin text-foreground" />;
                          }

                          return (
                            <td
                              key={ref.user_id}
                              className="border-r border-t border-border p-0 align-middle last:border-r-0"
                              style={{
                                width: REFEREE_COLUMN_WIDTH,
                                minWidth: REFEREE_COLUMN_WIDTH,
                                height: SESSION_ROW_HEIGHT,
                              }}
                            >
                              <DropdownMenu>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild disabled={isLoading || !clickable || isOtherAssigned}>
                                      <button
                                        type="button"
                                        aria-pressed={clickable ? isAssigned : undefined}
                                        aria-label={tooltipText}
                                        className={`flex h-full w-full items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed ${cellClass}`}
                                        style={{ height: SESSION_ROW_HEIGHT }}
                                      >
                                        {cellContent}
                                      </button>
                                    </DropdownMenuTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    {tooltipText}
                                  </TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="center" className="w-44 border border-[hsl(var(--color-200))] shadow-sm">
                                  <DropdownMenuItem onSelect={() => handleSetAvailabilityStatus(session, ref.user_id, true)}>
                                    <Check className="mr-2 h-3.5 w-3.5 text-success" />
                                    Beschikbaar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleSetAvailabilityStatus(session, ref.user_id, false)}>
                                    <X className="mr-2 h-3.5 w-3.5 text-destructive/80" />
                                    Niet beschikbaar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleSetAvailabilityStatus(session, ref.user_id, null)}>
                                    <Minus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                    Geen reactie
                                  </DropdownMenuItem>
                                  {(available || isAssigned) && <DropdownMenuSeparator />}
                                  {available && !isAssigned && !isOtherAssigned && (
                                    <DropdownMenuItem onSelect={() => handleAssign(session, ref.user_id)}>
                                      <Star className="mr-2 h-3.5 w-3.5 text-success" />
                                      Toewijzen
                                    </DropdownMenuItem>
                                  )}
                                  {isAssigned && assignment && (
                                    <DropdownMenuItem onSelect={() => handleRemove(assignment)}>
                                      <X className="mr-2 h-3.5 w-3.5 text-destructive/80" />
                                      Toewijzing verwijderen
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                      <div className="mt-1 flex flex-col gap-0.5">
                        {session.matches.map((m, i) => (
                          <div key={i} className="text-[10px] leading-tight text-muted-foreground/70">
                            {m.home_team_name} – {m.away_team_name}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 pt-1 lg:grid-cols-2">
                      {referees.map(ref => {
                        const available = isRefereeAvailable(session, ref.user_id);
                        const hasResponded = hasRefereeResponded(session, ref.user_id);
                        const assignment = getSessionAssignment(session, ref.user_id);
                        const isAssigned = !!assignment;
                        const isOtherAssigned = assignedRefId !== null && assignedRefId !== ref.user_id;
                        const cellKey = `${session.matches[0]?.match_id}-${ref.user_id}`;
                        const isLoadingCell = assigning === cellKey;

                        // Pill-stijl op basis van status
                        let pillClass = 'bg-card border border-border/60 text-muted-foreground'; // geen reactie
                        if (isAssigned) pillClass = 'pill-success-strong shadow-sm';
                        else if (available) pillClass = 'bg-success/15 border border-success/40 text-foreground';
                        else if (hasResponded) pillClass = 'bg-destructive/5 border border-destructive/30 text-foreground';

                        return (
                          <DropdownMenu key={ref.user_id}>
                            <DropdownMenuTrigger asChild disabled={isLoadingCell || (isOtherAssigned && !isAssigned)}>
                              <button
                                type="button"
                                className={`
                                  inline-flex min-h-[36px] w-full min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium
                                  transition-all
                                  ${pillClass}
                                  ${isOtherAssigned && !isAssigned ? 'opacity-40' : ''}
                                  disabled:cursor-not-allowed
                                `}
                              >
                                {isLoadingCell ? (
                                  <RefreshCw className="h-3 w-3 shrink-0 animate-spin" />
                                ) : isAssigned ? (
                                  <Star className="h-3 w-3 shrink-0 fill-white" />
                                ) : !hasResponded ? (
                                  <Minus className="h-3 w-3 shrink-0 opacity-60" />
                                ) : !available ? (
                                  <X className="h-3 w-3 shrink-0 opacity-60" />
                                ) : null}
                                <span className="truncate">{ref.username}</span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-44 border border-[hsl(var(--color-200))] shadow-sm">
                              <DropdownMenuItem onSelect={() => handleSetAvailabilityStatus(session, ref.user_id, true)}>
                                <Check className="mr-2 h-3.5 w-3.5 text-success" />
                                Beschikbaar
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleSetAvailabilityStatus(session, ref.user_id, false)}>
                                <X className="mr-2 h-3.5 w-3.5 text-destructive/80" />
                                Niet beschikbaar
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleSetAvailabilityStatus(session, ref.user_id, null)}>
                                <Minus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                Geen reactie
                              </DropdownMenuItem>
                              {(available || isAssigned) && <DropdownMenuSeparator />}
                              {available && !isAssigned && !isOtherAssigned && (
                                <DropdownMenuItem onSelect={() => handleAssign(session, ref.user_id)}>
                                  <Star className="mr-2 h-3.5 w-3.5 text-success" />
                                  Toewijzen
                                </DropdownMenuItem>
                              )}
                              {isAssigned && assignment && (
                                <DropdownMenuItem onSelect={() => handleRemove(assignment)}>
                                  <X className="mr-2 h-3.5 w-3.5 text-destructive/80" />
                                  Toewijzing verwijderen
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Collapsible
            open={copyMessagesOpen}
            onOpenChange={setCopyMessagesOpen}
            className="rounded-xl border border-border bg-card shadow-sm"
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">Copy/paste berichten</div>
                  <div className="text-xs text-muted-foreground">
                    Kant-en-klare tekst per scheidsrechter voor de toegewezen wedstrijden.
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    copyMessagesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 border-t border-border p-3">
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        Overzicht alle te spelen wedstrijden
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {allSessionsCopyMessage.sessionCount} wedstrijdblok
                        {allSessionsCopyMessage.sessionCount === 1 ? '' : 'ken'} · vraag beschikbaarheid op
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 gap-1.5 px-2"
                      onClick={() => copyText(allSessionsCopyMessage.text)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Kopieer
                    </Button>
                  </div>
                  <textarea
                    readOnly
                    value={allSessionsCopyMessage.text}
                    className="min-h-[140px] w-full resize-y rounded-md border border-border bg-background p-2 font-mono text-xs leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </div>
                {refereeCopyMessages.map((message) => (
                  <div key={message.refereeId} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{message.refereeName}</div>
                        <div className="text-xs text-muted-foreground">
                          {message.assignmentCount} wedstrijdblok{message.assignmentCount === 1 ? '' : 'ken'}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 gap-1.5 px-2"
                        onClick={() => copyText(message.text)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Kopieer
                      </Button>
                    </div>
                    <textarea
                      readOnly
                      value={message.text}
                      className="min-h-[96px] w-full resize-y rounded-md border border-border bg-background p-2 font-mono text-xs leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onFocus={(event) => event.currentTarget.select()}
                    />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TooltipProvider>
      )}
    </div>
  );
};

export default AvailabilityMatrix;
