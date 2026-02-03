import { useState, useEffect, useCallback } from 'react';
import { pollService, assignmentService, refereeAvailabilityService } from '@/services/scheidsrechter';
import type { MonthlyPoll, PollMatchDate, RefereeAssignment, AvailabilityInput } from '@/services/scheidsrechter/types';
import { toast } from 'sonner';

export interface RefereeDashboardData {
  // Poll data
  activePoll: MonthlyPoll | null;
  pollMatchDates: PollMatchDate[];
  myAvailability: Map<string, boolean>;
  
  // Assignments
  assignments: RefereeAssignment[];
  
  // Loading states
  isLoadingPoll: boolean;
  isLoadingAssignments: boolean;
  isSubmitting: boolean;
  
  // User info
  userId: number;
  username: string;
  
  // Actions
  submitAvailability: (pollGroupId: string, isAvailable: boolean) => Promise<void>;
  submitBulkAvailability: (availabilities: AvailabilityInput[]) => Promise<void>;
  confirmAssignment: (assignmentId: number) => Promise<void>;
  declineAssignment: (assignmentId: number, reason?: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useRefereeDashboard(): RefereeDashboardData {
  // User data from localStorage
  const userId = parseInt(localStorage.getItem('userId') || '0');
  const userData = localStorage.getItem('user');
  const username = userData ? JSON.parse(userData).username || 'Scheidsrechter' : 'Scheidsrechter';
  
  // Poll state
  const [activePoll, setActivePoll] = useState<MonthlyPoll | null>(null);
  const [pollMatchDates, setPollMatchDates] = useState<PollMatchDate[]>([]);
  const [myAvailability, setMyAvailability] = useState<Map<string, boolean>>(new Map());
  const [isLoadingPoll, setIsLoadingPoll] = useState(true);
  
  // Assignments state
  const [assignments, setAssignments] = useState<RefereeAssignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch active poll and availability
  const fetchPollData = useCallback(async () => {
    if (!userId) return;
    
    setIsLoadingPoll(true);
    try {
      // Fetch active poll
      const poll = await pollService.getActivePoll();
      setActivePoll(poll);
      
      if (poll) {
        // Fetch poll match dates
        const dates = await pollService.getPollMatchDates(poll.id);
        setPollMatchDates(dates);
        
        // Fetch my availability for this poll
        const availability = await refereeAvailabilityService.getRefereeAvailability(
          userId, 
          poll.poll_month
        );
        
        // Convert to map for easy lookup
        const availMap = new Map<string, boolean>();
        availability.forEach(a => {
          if (a.poll_group_id) {
            availMap.set(a.poll_group_id, a.is_available);
          }
        });
        setMyAvailability(availMap);
      }
    } catch (error) {
      console.error('Error fetching poll data:', error);
      toast.error('Kon poll gegevens niet ophalen');
    } finally {
      setIsLoadingPoll(false);
    }
  }, [userId]);
  
  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    if (!userId) return;
    
    setIsLoadingAssignments(true);
    try {
      const data = await assignmentService.getAssignmentsForReferee(userId);
      // Sort by match date (upcoming first)
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.match_date || '').getTime();
        const dateB = new Date(b.match_date || '').getTime();
        return dateA - dateB;
      });
      // Filter to only show active assignments (not declined/cancelled)
      const active = sorted.filter(a => a.status !== 'declined' && a.status !== 'cancelled');
      setAssignments(active);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Kon toewijzingen niet ophalen');
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [userId]);
  
  // Initial fetch
  useEffect(() => {
    fetchPollData();
    fetchAssignments();
  }, [fetchPollData, fetchAssignments]);
  
  // Auto-refresh assignments every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAssignments();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchAssignments]);
  
  // Submit single availability
  const submitAvailability = useCallback(async (pollGroupId: string, isAvailable: boolean) => {
    if (!activePoll || !userId) return;
    
    // Optimistic update
    setMyAvailability(prev => new Map(prev).set(pollGroupId, isAvailable));
    
    try {
      const success = await refereeAvailabilityService.updateAvailability(
        userId,
        null, // match_id
        pollGroupId,
        activePoll.poll_month,
        isAvailable
      );
      
      if (!success) {
        // Revert on failure
        setMyAvailability(prev => {
          const next = new Map(prev);
          next.delete(pollGroupId);
          return next;
        });
        toast.error('Kon beschikbaarheid niet opslaan');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Kon beschikbaarheid niet opslaan');
    }
  }, [activePoll, userId]);
  
  // Submit bulk availability
  const submitBulkAvailability = useCallback(async (availabilities: AvailabilityInput[]) => {
    if (!activePoll || !userId) return;
    
    setIsSubmitting(true);
    try {
      const result = await refereeAvailabilityService.submitAvailability(
        userId,
        activePoll.poll_month,
        availabilities
      );
      
      if (result.success) {
        toast.success('Beschikbaarheid opgeslagen!');
        // Refresh to get updated data
        await fetchPollData();
      } else {
        toast.error(result.error || 'Kon beschikbaarheid niet opslaan');
      }
    } catch (error) {
      console.error('Error submitting availability:', error);
      toast.error('Kon beschikbaarheid niet opslaan');
    } finally {
      setIsSubmitting(false);
    }
  }, [activePoll, userId, fetchPollData]);
  
  // Confirm assignment
  const confirmAssignment = useCallback(async (assignmentId: number) => {
    try {
      const success = await assignmentService.confirmAssignment(assignmentId);
      if (success) {
        toast.success('Toewijzing bevestigd!');
        await fetchAssignments();
      } else {
        toast.error('Kon toewijzing niet bevestigen');
      }
    } catch (error) {
      console.error('Error confirming assignment:', error);
      toast.error('Kon toewijzing niet bevestigen');
    }
  }, [fetchAssignments]);
  
  // Decline assignment
  const declineAssignment = useCallback(async (assignmentId: number, reason?: string) => {
    try {
      const success = await assignmentService.declineAssignment(assignmentId, reason);
      if (success) {
        toast.success('Toewijzing geweigerd');
        await fetchAssignments();
      } else {
        toast.error('Kon toewijzing niet weigeren');
      }
    } catch (error) {
      console.error('Error declining assignment:', error);
      toast.error('Kon toewijzing niet weigeren');
    }
  }, [fetchAssignments]);
  
  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchPollData(), fetchAssignments()]);
  }, [fetchPollData, fetchAssignments]);
  
  return {
    activePoll,
    pollMatchDates,
    myAvailability,
    assignments,
    isLoadingPoll,
    isLoadingAssignments,
    isSubmitting,
    userId,
    username,
    submitAvailability,
    submitBulkAvailability,
    confirmAssignment,
    declineAssignment,
    refreshData,
  };
}
