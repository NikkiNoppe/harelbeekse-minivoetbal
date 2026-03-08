import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import type { 
  RefereeAssignment, 
  CreateAssignmentInput,
  AssignmentStatus,
  AvailableReferee,
  RefereeAssignmentStats 
} from "./types";

/**
 * Service voor scheidsrechter toewijzingen
 */
export const assignmentService = {
  /**
   * Wijs een scheidsrechter toe aan een wedstrijd
   */
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

  /**
   * Haal alle toewijzingen op voor een scheidsrechter
   */
  async getAssignmentsForReferee(
    refereeId: number, 
    month?: string
  ): Promise<RefereeAssignment[]> {
    try {
      // Haal assignments op
      const { data, error } = await supabase
        .from('referee_assignments' as any)
        .select('*')
        .eq('referee_id', refereeId)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error fetching referee assignments:', error);
        return [];
      }

      const assignments = data as any[] || [];
      if (assignments.length === 0) return [];

      // Haal match data op
      const matchIds = assignments.map(a => a.match_id);
      const { data: matches } = await supabase
        .from('matches')
        .select('match_id, match_date, location, home_team_id, away_team_id')
        .in('match_id', matchIds);

      const matchMap = new Map((matches || []).map(m => [m.match_id, m]));

      // Filter op maand als opgegeven
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

      // Haal team names op
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
          status: a.status,
          confirmed_at: a.confirmed_at,
          notes: a.notes,
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

  /**
   * Haal niet-toegewezen wedstrijden op voor een maand
   */
  async getUnassignedMatches(month: string): Promise<any[]> {
    try {
      const [year, monthNum] = month.split('-').map(Number);
      const nextMonth = monthNum === 12 
        ? `${year + 1}-01` 
        : `${year}-${String(monthNum + 1).padStart(2, '0')}`;

      // Haal wedstrijden op die nog geen toewijzing hebben
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

      // Haal team names op
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

  /**
   * Verwijder een toewijzing
   */
  async removeAssignment(assignmentId: number): Promise<boolean> {
    try {
      const userId = parseInt(localStorage.getItem('userId') || '0');
      const { data, error } = await supabase.rpc('remove_referee_assignment', {
        p_user_id: userId,
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

  /**
   * Update de status van een toewijzing
   */
  async updateAssignmentStatus(
    assignmentId: number,
    status: AssignmentStatus,
    notes?: string
  ): Promise<boolean> {
    try {
      return await withUserContext(async () => {
        const updateData: any = { status };
        
        if (status === 'confirmed') {
          updateData.confirmed_at = new Date().toISOString();
        }
        if (notes !== undefined) {
          updateData.notes = notes;
        }

        const { error } = await supabase
          .from('referee_assignments' as any)
          .update(updateData)
          .eq('id', assignmentId);

        if (error) {
          console.error('Error updating assignment status:', error);
          return false;
        }

        // Als geweigerd, verwijder ook uit matches tabel
        if (status === 'declined' || status === 'cancelled') {
          const { data: assignment } = await supabase
            .from('referee_assignments' as any)
            .select('match_id')
            .eq('id', assignmentId)
            .single();

          const assignmentData = assignment as any;
          if (assignmentData) {
            await supabase
              .from('matches')
              .update({
                assigned_referee_id: null,
                referee: null
              })
              .eq('match_id', assignmentData.match_id);
          }
        }

        return true;
      });
    } catch (error) {
      console.error('Error in updateAssignmentStatus:', error);
      return false;
    }
  },

  /**
   * Bevestig een toewijzing (door scheidsrechter)
   */
  async confirmAssignment(assignmentId: number): Promise<boolean> {
    return this.updateAssignmentStatus(assignmentId, 'confirmed');
  },

  /**
   * Weiger een toewijzing (door scheidsrechter)
   */
  async declineAssignment(assignmentId: number, reason?: string): Promise<boolean> {
    return this.updateAssignmentStatus(assignmentId, 'declined', reason);
  },

  /**
   * Haal beschikbare scheidsrechters op voor een wedstrijd
   */
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

  /**
   * Haal toewijzings statistieken op per scheidsrechter
   */
  async getAssignmentStats(month?: string): Promise<RefereeAssignmentStats[]> {
    try {
      return await withUserContext(async () => {
        // Haal alle referees op
        const { data: referees } = await supabase
          .from('users')
          .select('user_id, username')
          .eq('role', 'referee');

        if (!referees) return [];

        // Haal alle assignments op
        const { data: assignments } = await supabase
          .from('referee_assignments' as any)
          .select('referee_id, status');

        // Bereken stats per referee
        return referees.map(ref => {
          const refAssignments = (assignments as any[] || []).filter(
            a => a.referee_id === ref.user_id
          );

          return {
            referee_id: ref.user_id,
            referee_name: ref.username,
            total_assignments: refAssignments.length,
            pending_count: refAssignments.filter(a => a.status === 'pending').length,
            confirmed_count: refAssignments.filter(a => a.status === 'confirmed').length,
            declined_count: refAssignments.filter(a => a.status === 'declined').length
          };
        });
      });
    } catch (error) {
      console.error('Error in getAssignmentStats:', error);
      return [];
    }
  },

  /**
   * Haal assignment op voor een specifieke wedstrijd
   */
  async getAssignmentForMatch(matchId: number): Promise<RefereeAssignment | null> {
    try {
      const { data, error } = await supabase
        .from('referee_assignments' as any)
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (error || !data) return null;
      return data as unknown as RefereeAssignment;
    } catch (error) {
      console.error('Error in getAssignmentForMatch:', error);
      return null;
    }
  }
};
