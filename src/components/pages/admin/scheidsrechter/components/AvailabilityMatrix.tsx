import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { RefreshCw, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { assignmentService } from '@/services/scheidsrechter/assignmentService';
import { useAuth } from '@/hooks/useAuth';
import { formatDateWithDay, formatTimeForDisplay } from '@/lib/dateUtils';

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
}

// Month options helper
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

const AvailabilityMatrix: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [referees, setReferees] = useState<RefereeInfo[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [availability, setAvailability] = useState<AvailabilityData[]>([]);
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null); // "matchId-refId"

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [year, monthNum] = selectedMonth.split('-').map(Number);
      const nextMonth = monthNum === 12
        ? `${year + 1}-01`
        : `${year}-${String(monthNum + 1).padStart(2, '0')}`;

      // Parallel fetch: matches, referees, availability, assignments
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
      
      // Filter assignments to only this month's matches
      const matchIds = new Set(matchesData.map(m => m.match_id));
      const allAssignments = (assignRes.data || []) as AssignmentData[];
      const monthAssignments = allAssignments.filter(a => matchIds.has(a.match_id));

      // Get team names
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

      // Group matches into sessions (date + location)
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
        return dc !== 0 ? dc : a.location.localeCompare(b.location);
      });

      setReferees(refereesData);
      setSessions(sortedSessions);
      setAvailability(availData);
      setAssignments(monthAssignments);
    } catch (error) {
      console.error('Error fetching matrix data:', error);
      toast.error('Fout bij ophalen gegevens');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Check if referee is available for a session (by match_id or poll_group_id)
  const isRefereeAvailable = useCallback((session: Session, refereeId: number): boolean => {
    // Check by match_id for any match in the session
    for (const match of session.matches) {
      const avail = availability.find(a => a.user_id === refereeId && a.match_id === match.match_id);
      if (avail) return avail.is_available;
    }
    // Check by poll_group_id pattern
    const pollGroupId = `${selectedMonth}_${session.matches[0]?.match_id || 'general'}`;
    const byGroup = availability.find(a => a.user_id === refereeId && a.poll_group_id === pollGroupId);
    if (byGroup) return byGroup.is_available;
    
    return false;
  }, [availability, selectedMonth]);

  // Check if referee is assigned to any match in the session
  const getSessionAssignment = useCallback((session: Session, refereeId: number): AssignmentData | null => {
    for (const match of session.matches) {
      const assignment = assignments.find(a => a.match_id === match.match_id && a.referee_id === refereeId);
      if (assignment) return assignment;
    }
    return null;
  }, [assignments]);

  // Check if session already has an assigned referee
  const getSessionAssignedReferee = useCallback((session: Session): number | null => {
    for (const match of session.matches) {
      if (match.assigned_referee_id) return match.assigned_referee_id;
      const assignment = assignments.find(a => a.match_id === match.match_id && a.status !== 'declined' && a.status !== 'cancelled');
      if (assignment) return assignment.referee_id;
    }
    return null;
  }, [assignments]);

  // Handle assign click
  const handleAssign = async (session: Session, refereeId: number) => {
    // Find first unassigned match in this session
    const targetMatch = session.matches.find(m => !m.assigned_referee_id);
    if (!targetMatch) {
      toast.error('Alle wedstrijden in deze sessie zijn al toegewezen');
      return;
    }

    const cellKey = `${targetMatch.match_id}-${refereeId}`;
    setAssigning(cellKey);

    try {
      const result = await assignmentService.assignReferee(
        { match_id: targetMatch.match_id, referee_id: refereeId },
        user?.id || 0
      );

      if (result.success) {
        toast.success(`Scheidsrechter toegewezen`);
        await fetchData();
      } else {
        toast.error(result.error || 'Toewijzing mislukt');
      }
    } catch {
      toast.error('Onverwachte fout');
    } finally {
      setAssigning(null);
    }
  };

  // Handle remove assignment
  const handleRemove = async (assignment: AssignmentData) => {
    setAssigning(`${assignment.match_id}-${assignment.referee_id}`);
    try {
      const success = await assignmentService.removeAssignment(assignment.id);
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

  // Stats
  const totalSessions = sessions.length;
  const assignedSessions = sessions.filter(s => getSessionAssignedReferee(s) !== null).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-10 w-10" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
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
        <div className="flex gap-2 items-center text-sm text-muted-foreground">
          <Badge variant="outline">{assignedSessions}/{totalSessions} sessies toegewezen</Badge>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-[var(--color-success)]/20 border border-[var(--color-success)]/40" />
          <span>Beschikbaar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-[var(--color-success)] flex items-center justify-center">
            <X className="h-3 w-3 text-white" />
          </div>
          <span>Toegewezen</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-muted border border-border" />
          <span>Niet beschikbaar</span>
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Geen wedstrijden gevonden voor deze maand</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Matrix */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted/90 backdrop-blur-sm text-left p-3 font-semibold min-w-[200px] border-r border-border">
                    Sessie
                  </th>
                  {referees.map(ref => (
                    <th key={ref.user_id} className="p-2 text-center font-medium min-w-[80px] border-r border-border last:border-r-0">
                      <span className="block truncate max-w-[80px]" title={ref.username}>
                        {ref.username.split(' ').map((w, i) => i === 0 ? w : w[0] + '.').join(' ')}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const assignedRefId = getSessionAssignedReferee(session);
                  return (
                    <tr key={session.key} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="sticky left-0 z-10 bg-card backdrop-blur-sm p-3 border-r border-border">
                        <div className="font-medium text-foreground">
                          {formatDateWithDay(session.date)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {session.location} · {formatTimeForDisplay(session.date)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {session.matches.map(m => `${m.home_team_name} - ${m.away_team_name}`).join(' · ')}
                        </div>
                      </td>
                      {referees.map(ref => {
                        const available = isRefereeAvailable(session, ref.user_id);
                        const assignment = getSessionAssignment(session, ref.user_id);
                        const isAssigned = !!assignment;
                        const isOtherAssigned = assignedRefId !== null && assignedRefId !== ref.user_id;
                        const cellKey = `${session.matches[0]?.match_id}-${ref.user_id}`;
                        const isLoading = assigning === cellKey;

                        return (
                          <td
                            key={ref.user_id}
                            className={`p-1 text-center border-r border-border last:border-r-0 transition-colors ${
                              isAssigned
                                ? 'bg-[var(--color-success)] cursor-pointer'
                                : available
                                ? 'bg-[var(--color-success)]/20 cursor-pointer hover:bg-[var(--color-success)]/35'
                                : 'bg-transparent'
                            } ${isOtherAssigned && !isAssigned ? 'opacity-40' : ''}`}
                            onClick={() => {
                              if (isLoading) return;
                              if (isAssigned && assignment) {
                                handleRemove(assignment);
                              } else if (available && !isOtherAssigned) {
                                handleAssign(session, ref.user_id);
                              }
                            }}
                            title={
                              isAssigned
                                ? `${ref.username} - Klik om te verwijderen`
                                : available
                                ? `${ref.username} - Klik om toe te wijzen`
                                : `${ref.username} - Niet beschikbaar`
                            }
                          >
                            {isLoading ? (
                              <RefreshCw className="h-4 w-4 mx-auto animate-spin text-muted-foreground" />
                            ) : isAssigned ? (
                              <X className="h-4 w-4 mx-auto text-white font-bold" />
                            ) : available ? (
                              <Check className="h-3.5 w-3.5 mx-auto text-[var(--color-success-dark)] opacity-50" />
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: Card per session */}
          <div className="md:hidden space-y-3">
            {sessions.map((session) => {
              const assignedRefId = getSessionAssignedReferee(session);
              return (
                <Card key={session.key}>
                  <CardContent className="p-3 space-y-2">
                    {/* Session header */}
                    <div>
                      <div className="font-medium text-sm">{formatDateWithDay(session.date)}</div>
                      <div className="text-xs text-muted-foreground">
                        {session.location} · {formatTimeForDisplay(session.date)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {session.matches.map(m => `${m.home_team_name} - ${m.away_team_name}`).join(' · ')}
                      </div>
                    </div>

                    {/* Referee chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {referees.map(ref => {
                        const available = isRefereeAvailable(session, ref.user_id);
                        const assignment = getSessionAssignment(session, ref.user_id);
                        const isAssigned = !!assignment;
                        const isOtherAssigned = assignedRefId !== null && assignedRefId !== ref.user_id;
                        const cellKey = `${session.matches[0]?.match_id}-${ref.user_id}`;
                        const isLoadingCell = assigning === cellKey;

                        if (!available && !isAssigned) return null; // Hide unavailable refs on mobile

                        return (
                          <button
                            key={ref.user_id}
                            disabled={isLoadingCell || (isOtherAssigned && !isAssigned)}
                            onClick={() => {
                              if (isAssigned && assignment) {
                                handleRemove(assignment);
                              } else if (available) {
                                handleAssign(session, ref.user_id);
                              }
                            }}
                            className={`
                              inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium
                              transition-all min-h-[32px]
                              ${isAssigned
                                ? 'bg-[var(--color-success)] text-white'
                                : 'bg-[var(--color-success)]/20 text-[var(--color-success-dark)] border border-[var(--color-success)]/40'
                              }
                              ${isOtherAssigned && !isAssigned ? 'opacity-40' : ''}
                              disabled:cursor-not-allowed
                            `}
                          >
                            {isLoadingCell ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : isAssigned ? (
                              <X className="h-3 w-3" />
                            ) : null}
                            {ref.username.split(' ').map((w, i) => i === 0 ? w : w[0] + '.').join(' ')}
                          </button>
                        );
                      })}
                      {/* Show if no one is available */}
                      {referees.every(ref => !isRefereeAvailable(session, ref.user_id) && !getSessionAssignment(session, ref.user_id)) && (
                        <span className="text-xs text-muted-foreground italic">Geen beschikbaarheid</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default AvailabilityMatrix;
