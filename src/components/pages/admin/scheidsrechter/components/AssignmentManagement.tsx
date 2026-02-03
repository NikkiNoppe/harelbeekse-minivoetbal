import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { RefreshCw, Filter, UserCheck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { assignmentService } from '@/services/scheidsrechter/assignmentService';
import { refereeAvailabilityService } from '@/services/scheidsrechter/refereeAvailabilityService';
import type { RefereeAssignmentStats } from '@/services/scheidsrechter/types';
import AssignmentCard from './AssignmentCard';

interface MatchWithAssignment {
  match_id: number;
  match_date: string;
  location: string | null;
  home_team_name: string;
  away_team_name: string;
  assigned_referee_id: number | null;
  current_referee_name?: string;
  current_assignment?: any;
}

// Helper: Generate month options
const getMonthOptions = () => {
  const months = [];
  const currentDate = new Date();
  for (let i = -1; i <= 6; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'MMMM yyyy', { locale: nl });
    months.push({ value, label });
  }
  return months;
};

const AssignmentManagement: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [matches, setMatches] = useState<MatchWithAssignment[]>([]);
  const [stats, setStats] = useState<RefereeAssignmentStats[]>([]);
  const [availabilityStats, setAvailabilityStats] = useState<{
    total_referees: number;
    responded_count: number;
    available_by_date: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [year, monthNum] = selectedMonth.split('-').map(Number);
      const nextMonth = monthNum === 12 
        ? `${year + 1}-01` 
        : `${year}-${String(monthNum + 1).padStart(2, '0')}`;

      // Fetch matches for month
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          match_id,
          match_date,
          location,
          home_team_id,
          away_team_id,
          assigned_referee_id,
          referee
        `)
        .gte('match_date', `${selectedMonth}-01`)
        .lt('match_date', `${nextMonth}-01`)
        .order('match_date', { ascending: true });

      if (matchesError) throw matchesError;

      // Get team names
      const teamIds = new Set<number>();
      (matchesData || []).forEach(m => {
        if (m.home_team_id) teamIds.add(m.home_team_id);
        if (m.away_team_id) teamIds.add(m.away_team_id);
      });

      const { data: teams } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .in('team_id', Array.from(teamIds));

      const teamMap = new Map(teams?.map(t => [t.team_id, t.team_name]) || []);

      // Get assignments for these matches
      const matchIds = (matchesData || []).map(m => m.match_id);
      const { data: assignments } = await (supabase
        .from('referee_assignments' as any)
        .select('*')
        .in('match_id', matchIds) as any);

      const assignmentMap = new Map((assignments || []).map(a => [a.match_id, a]));

      // Combine data
      const enrichedMatches: MatchWithAssignment[] = (matchesData || []).map(m => ({
        match_id: m.match_id,
        match_date: m.match_date,
        location: m.location,
        home_team_name: teamMap.get(m.home_team_id!) || 'Onbekend',
        away_team_name: teamMap.get(m.away_team_id!) || 'Onbekend',
        assigned_referee_id: m.assigned_referee_id,
        current_referee_name: m.referee || undefined,
        current_assignment: assignmentMap.get(m.match_id)
      }));

      setMatches(enrichedMatches);

      // Fetch stats
      const [assignmentStats, availStats] = await Promise.all([
        assignmentService.getAssignmentStats(selectedMonth),
        refereeAvailabilityService.getAvailabilityStats(selectedMonth)
      ]);

      setStats(assignmentStats);
      setAvailabilityStats(availStats);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Fout bij ophalen gegevens');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter matches
  const filteredMatches = matches.filter(m => {
    if (statusFilter === 'assigned') return !!m.assigned_referee_id || !!m.current_referee_name;
    if (statusFilter === 'unassigned') return !m.assigned_referee_id && !m.current_referee_name;
    return true;
  });

  const assignedCount = matches.filter(m => m.assigned_referee_id || m.current_referee_name).length;
  const unassignedCount = matches.length - assignedCount;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Scheidsrechter Toewijzingen</h2>
          <p className="text-sm text-muted-foreground">
            Wijs scheidsrechters toe aan wedstrijden
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-success/10">
                <UserCheck className="h-4 w-4 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{assignedCount}</div>
                <div className="text-xs text-muted-foreground">Toegewezen</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-warning/10">
                <Filter className="h-4 w-4 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{unassignedCount}</div>
                <div className="text-xs text-muted-foreground">Open</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {availabilityStats?.responded_count || 0}/{availabilityStats?.total_referees || 0}
                </div>
                <div className="text-xs text-muted-foreground">Poll respons</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-muted">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{matches.length}</div>
                <div className="text-xs text-muted-foreground">Wedstrijden</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Alles ({matches.length})
        </Button>
        <Button
          variant={statusFilter === 'unassigned' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('unassigned')}
        >
          Open ({unassignedCount})
        </Button>
        <Button
          variant={statusFilter === 'assigned' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('assigned')}
        >
          Toegewezen ({assignedCount})
        </Button>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-muted-foreground">
              {statusFilter === 'unassigned' 
                ? 'Alle wedstrijden zijn toegewezen!'
                : statusFilter === 'assigned'
                ? 'Nog geen wedstrijden toegewezen'
                : 'Geen wedstrijden gevonden voor deze maand'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map(match => (
            <AssignmentCard
              key={match.match_id}
              match={match}
              onAssignmentChange={fetchData}
            />
          ))}
        </div>
      )}

      {/* Referee Stats */}
      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Toewijzingen per Scheidsrechter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.map(referee => (
                <Badge 
                  key={referee.referee_id} 
                  variant="outline"
                  className="px-3 py-1"
                >
                  {referee.referee_name}: {referee.total_assignments}
                  {referee.pending_count > 0 && (
                    <span className="ml-1 text-warning">({referee.pending_count} ⏳)</span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssignmentManagement;
