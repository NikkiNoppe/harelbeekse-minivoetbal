import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import {
  fetchAvailableRefereesForMatch,
  fetchRefereeAssignmentsForSession,
  fetchScheidsAssignmentStats,
  fetchScheidsScheduleForMonth,
} from "@/services/scheidsrechter/scheidsSessionFetch";
import type {
  RefereeAssignment,
  CreateAssignmentInput,
  AvailableReferee,
  RefereeAssignmentStats
} from "./types";

export const assignmentService = {
  async assignReferee(
    input: CreateAssignmentInput,
    _assignedBy?: number
  ): Promise<{ success: boolean; assignment?: RefereeAssignment; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('assign_referee_to_match', {
        ...getRpcSessionArgs(),
        p_match_id: input.match_id,
        p_referee_id: input.referee_id,
        p_notes: input.notes || null,
      });

      if (error) {
        console.error('Error in assign_referee_to_match RPC:', error);
        return { success: false, error: 'Kon toewijzing niet aanmaken' };
      }

      const result = data as { success?: boolean; error?: string };
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
    _assignedBy?: number,
    notes?: string
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('assign_referee_to_session', {
        ...getRpcSessionArgs(),
        p_match_id: matchId,
        p_referee_id: refereeId,
        p_notes: notes || null,
      });

      if (error) {
        console.error('Error in assign_referee_to_session RPC:', error);
        return { success: false, error: 'Kon toewijzing niet aanmaken' };
      }

      const result = data as { success?: boolean; error?: string; assignments_created?: number };
      if (!result?.success) {
        return { success: false, error: result?.error || 'Toewijzing mislukt' };
      }

      return { success: true, count: result.assignments_created };
    } catch (error) {
      console.error('Error in assignRefereeToSession:', error);
      return { success: false, error: 'Onverwachte fout bij toewijzen' };
    }
  },

  async removeSessionAssignment(matchId: number, _userId?: number): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('remove_referee_from_session', {
        ...getRpcSessionArgs(),
        p_match_id: matchId,
      });

      if (error) {
        console.error('Error in remove_referee_from_session RPC:', error);
        return false;
      }

      const result = data as { success?: boolean };
      return result?.success || false;
    } catch (error) {
      console.error('Error in removeSessionAssignment:', error);
      return false;
    }
  },

  async getAssignmentsForReferee(
    _refereeId: number,
    month?: string
  ): Promise<RefereeAssignment[]> {
    try {
      const rows = await fetchRefereeAssignmentsForSession(month);
      return rows.map((a) => ({
        id: a.id,
        match_id: a.match_id,
        referee_id: a.referee_id,
        assigned_at: a.assigned_at,
        assigned_by: a.assigned_by,
        match_date: a.match_date ?? undefined,
        location: a.location ?? undefined,
        home_team_name: a.home_team_name || 'Onbekend',
        away_team_name: a.away_team_name || 'Onbekend',
      }));
    } catch (error) {
      console.error('Error in getAssignmentsForReferee:', error);
      return [];
    }
  },

  async getUnassignedMatches(month: string): Promise<Array<{
    match_id: number;
    match_date: string;
    location: string | null;
    home_team_id: number | null;
    away_team_id: number | null;
    assigned_referee_id: number | null;
    home_team_name: string;
    away_team_name: string;
  }>> {
    try {
      const rows = await fetchScheidsScheduleForMonth(month);
      return rows
        .filter((m) => m.assigned_referee_id == null)
        .map((m) => ({
          match_id: m.match_id,
          match_date: m.match_date,
          location: m.location,
          home_team_id: m.home_team_id,
          away_team_id: m.away_team_id,
          assigned_referee_id: m.assigned_referee_id,
          home_team_name: m.home_team_name || 'Onbekend',
          away_team_name: m.away_team_name || 'Onbekend',
        }));
    } catch (error) {
      console.error('Error in getUnassignedMatches:', error);
      return [];
    }
  },

  async removeAssignment(assignmentId: number, _userId?: number): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('remove_referee_assignment', {
        ...getRpcSessionArgs(),
        p_assignment_id: assignmentId,
      });

      if (error) {
        console.error('Error in remove_referee_assignment RPC:', error);
        return false;
      }

      const result = data as { success?: boolean };
      return result?.success || false;
    } catch (error) {
      console.error('Error in removeAssignment:', error);
      return false;
    }
  },

  async getAvailableRefereesForMatch(matchId: number): Promise<AvailableReferee[]> {
    try {
      const data = await fetchAvailableRefereesForMatch(matchId);
      return (data || []).map((r: {
        user_id: number;
        username: string;
        is_available: boolean;
        has_conflict: boolean;
      }) => ({
        user_id: r.user_id,
        username: r.username,
        is_available: r.is_available || false,
        has_conflict: r.has_conflict || false,
      }));
    } catch (error) {
      console.error('Error in getAvailableRefereesForMatch:', error);
      return [];
    }
  },

  async getAssignmentStats(month?: string): Promise<RefereeAssignmentStats[]> {
    try {
      const stats = await fetchScheidsAssignmentStats(month);
      return stats.map((row) => ({
        referee_id: row.referee_id,
        referee_name: row.referee_name,
        total_assignments: row.total_assignments,
        pending_count: 0,
        confirmed_count: row.total_assignments,
        declined_count: 0,
      }));
    } catch (error) {
      console.error('Error in getAssignmentStats:', error);
      return [];
    }
  },

  async getAssignmentForMatch(matchId: number): Promise<RefereeAssignment | null> {
    try {
      const rows = await fetchRefereeAssignmentsForSession();
      const a = rows.find((row) => row.match_id === matchId);
      if (!a) return null;
      return {
        id: a.id,
        match_id: a.match_id,
        referee_id: a.referee_id,
        assigned_by: a.assigned_by,
        assigned_at: a.assigned_at,
      };
    } catch (error) {
      console.error('Error in getAssignmentForMatch:', error);
      return null;
    }
  },
};
