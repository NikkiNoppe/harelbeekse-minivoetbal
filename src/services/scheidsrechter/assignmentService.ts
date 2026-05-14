import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import type {
  RefereeAssignment,
  CreateAssignmentInput,
  AvailableReferee,
  RefereeAssignmentStats
} from "./types";

/**
 * Service voor scheidsrechter toewijzingen.
 * Een rij in `referee_matches` geldt als toewijzing zodra `assigned_at` ingevuld is.
 */
export const assignmentService = {
  async assignReferee(
    input: CreateAssignmentInput,
    assignedBy: number
  ): Promise<{ success: boolean; assignment?: RefereeAssignment; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('assign_referee_to_match', {
        p_user_id: assignedBy,
        p_match_id: input.match_id,
        p_referee_id: input.referee_id,
        p_notes: input.notes || null
      });

      if (error) {
        console.error('Error in assign_referee_to_match RPC:', error);
        return { success: false, error: 'Kon toewijzing niet aanmaken' };
      }

      const result = data as any;
      if (!result?.success) {
        return { success: false, error: result?.error || 'Toewijzing mislukt' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in assignReferee:', error);
      return { success: false, error: 'Onverwachte fout bij toewijzen' };
    }
  },

  async assignRefereeToSession(
    matchId: number,
    refereeId: number,
    assignedBy: number,
    notes?: string
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('assign_referee_to_session' as any, {
        p_user_id: assignedBy,
        p_match_id: matchId,
        p_referee_id: refereeId,
        p_notes: notes || null
      });

      if (error) {
        console.error('Error in assign_referee_to_session RPC:', error);
        return { success: false, error: 'Kon toewijzing niet aanmaken' };
      }

      const result = data as any;
      if (!result?.success) {
        return { success: false, error: result?.error || 'Toewijzing mislukt' };
      }

      return { success: true, count: result.assignments_created };
    } catch (error) {
      console.error('Error in assignRefereeToSession:', error);
      return { success: false, error: 'Onverwachte fout bij toewijzen' };
    }
  },

  async removeSessionAssignment(matchId: number, userId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('remove_referee_from_session' as any, {
        p_user_id: userId,
        p_match_id: matchId
      });

      if (error) {
        console.error('Error in remove_referee_from_session RPC:', error);
        return false;
      }

      const result = data as any;
      return result?.success || false;
    } catch (error) {
      console.error('Error in removeSessionAssignment:', error);
      return false;
    }
  },

  async getAssignmentsForReferee(
    refereeId: number,
    month?: string
  ): Promise<RefereeAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('referee_matches' as any)
        .select('id, match_id, referee_id, assigned_by, assigned_at')
        .eq('referee_id', refereeId)
        .not('assigned_at', 'is', null)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error fetching referee assignments:', error);
        return [];
      }

      const assignments = data as any[] || [];
      if (assignments.length === 0) return [];

      const matchIds = assignments.map(a => a.match_id);
      const { data: matches } = await supabase
        .from('matches')
        .select('match_id, match_date, location, home_team_id, away_team_id')
        .in('match_id', matchIds);

      const matchMap = new Map((matches || []).map(m => [m.match_id, m]));

      let filteredAssignments = assignments;
      if (month) {
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 1);

        filteredAssignments = assignments.filter(a => {
          const match = matchMap.get(a.match_id);
          if (!match) return false;
          const matchDate = new Date(match.match_date);
          return matchDate >= startDate && matchDate < endDate;
        });
      }

      const teamIds = new Set<number>();
      (matches || []).forEach(m => {
        if (m.home_team_id) teamIds.add(m.home_team_id);
        if (m.away_team_id) teamIds.add(m.away_team_id);
      });

      const { data: teams } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .in('team_id', Array.from(teamIds));

      const teamMap = new Map(teams?.map(t => [t.team_id, t.team_name]) || []);

      return filteredAssignments.map(a => {
        const match = matchMap.get(a.match_id);
        return {
          id: a.id,
          match_id: a.match_id,
          referee_id: a.referee_id,
          assigned_at: a.assigned_at,
          assigned_by: a.assigned_by,
          match_date: match?.match_date,
          location: match?.location,
          home_team_name: teamMap.get(match?.home_team_id) || 'Onbekend',
          away_team_name: teamMap.get(match?.away_team_id) || 'Onbekend'
        };
      });
    } catch (error) {
      console.error('Error in getAssignmentsForReferee:', error);
      return [];
    }
  },

  async getUnassignedMatches(month: string): Promise<any[]> {
    try {
      const [year, monthNum] = month.split('-').map(Number);
      const nextMonth = monthNum === 12
        ? `${year + 1}-01`
        : `${year}-${String(monthNum + 1).padStart(2, '0')}`;

      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          match_id,
          match_date,
          location,
          home_team_id,
          away_team_id,
          assigned_referee_id
        `)
        .gte('match_date', `${month}-01`)
        .lt('match_date', `${nextMonth}-01`)
        .is('assigned_referee_id', null)
        .order('match_date', { ascending: true });

      if (error) {
        console.error('Error fetching unassigned matches:', error);
        return [];
      }

      const teamIds = new Set<number>();
      (matches || []).forEach(m => {
        if (m.home_team_id) teamIds.add(m.home_team_id);
        if (m.away_team_id) teamIds.add(m.away_team_id);
      });

      const { data: teams } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .in('team_id', Array.from(teamIds));

      const teamMap = new Map(teams?.map(t => [t.team_id, t.team_name]) || []);

      return (matches || []).map(m => ({
        ...m,
        home_team_name: teamMap.get(m.home_team_id!) || 'Onbekend',
        away_team_name: teamMap.get(m.away_team_id!) || 'Onbekend'
      }));
    } catch (error) {
      console.error('Error in getUnassignedMatches:', error);
      return [];
    }
  },

  async removeAssignment(assignmentId: number, userId?: number): Promise<boolean> {
    try {
      const resolvedUserId = userId || 0;
      const { data, error } = await supabase.rpc('remove_referee_assignment', {
        p_user_id: resolvedUserId,
        p_assignment_id: assignmentId
      });

      if (error) {
        console.error('Error in remove_referee_assignment RPC:', error);
        return false;
      }

      const result = data as any;
      return result?.success || false;
    } catch (error) {
      console.error('Error in removeAssignment:', error);
      return false;
    }
  },

  async getAvailableRefereesForMatch(matchId: number): Promise<AvailableReferee[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_available_referees_for_match', {
          p_match_id: matchId
        });

      if (error) {
        console.error('Error fetching available referees:', error);
        return [];
      }

      return (data || []).map((r: any) => ({
        user_id: r.user_id,
        username: r.username,
        is_available: r.is_available || false,
        has_conflict: r.has_conflict || false
      }));
    } catch (error) {
      console.error('Error in getAvailableRefereesForMatch:', error);
      return [];
    }
  },

  async getAssignmentStats(_month?: string): Promise<RefereeAssignmentStats[]> {
    try {
      return await withUserContext(async () => {
        const { data: referees } = await supabase
          .from('users')
          .select('user_id, username')
          .eq('role', 'referee');

        if (!referees) return [];

        const { data: assignments } = await supabase
          .from('referee_matches' as any)
          .select('referee_id, assigned_at')
          .not('assigned_at', 'is', null);

        return referees.map(ref => {
          const refAssignments = (assignments as any[] || []).filter(
            a => a.referee_id === ref.user_id
          );

          return {
            referee_id: ref.user_id,
            referee_name: ref.username,
            total_assignments: refAssignments.length,
            pending_count: 0,
            confirmed_count: refAssignments.length,
            declined_count: 0
          };
        });
      });
    } catch (error) {
      console.error('Error in getAssignmentStats:', error);
      return [];
    }
  },

  async getAssignmentForMatch(matchId: number): Promise<RefereeAssignment | null> {
    try {
      const { data, error } = await supabase
        .from('referee_matches' as any)
        .select('id, match_id, referee_id, assigned_by, assigned_at')
        .eq('match_id', matchId)
        .not('assigned_at', 'is', null)
        .maybeSingle();

      if (error || !data) return null;
      const a = data as any;
      return {
        id: a.id,
        match_id: a.match_id,
        referee_id: a.referee_id,
        assigned_by: a.assigned_by,
        assigned_at: a.assigned_at,
      } as unknown as RefereeAssignment;
    } catch (error) {
      console.error('Error in getAssignmentForMatch:', error);
      return null;
    }
  }
};
