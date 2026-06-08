import { useState, useEffect, useCallback } from 'react';
import { getStoredAuthData } from '@/lib/authSession';
import {
  assignmentService,
  refereeAvailabilityService,
  monthScheduleService,
} from '@/services/scheidsrechter';
import type {
  RefereeAssignment,
  AvailabilityInput,
} from '@/services/scheidsrechter/types';
import type { ScheduleCluster } from '@/services/scheidsrechter/monthScheduleService';
import { toast } from 'sonner';

export interface RefereeDashboardData {
  clusters: ScheduleCluster[];
  myAvailability: Map<string, boolean>;
  assignments: RefereeAssignment[];
  isLoadingSchedule: boolean;
  isLoadingAssignments: boolean;
  isSubmitting: boolean;
  userId: number;
  username: string;
  submitAvailability: (clusterKey: string, pollMonth: string, isAvailable: boolean) => Promise<void>;
  submitBulkAvailability: (pollMonth: string, availabilities: AvailabilityInput[]) => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useRefereeDashboard(): RefereeDashboardData {
  const auth = getStoredAuthData();
  const userId = auth?.user?.id ?? 0;
  const username = auth?.user?.username || 'Scheidsrechter';

  const [clusters, setClusters] = useState<ScheduleCluster[]>([]);
  const [myAvailability, setMyAvailability] = useState<Map<string, boolean>>(new Map());
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);

  const [assignments, setAssignments] = useState<RefereeAssignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchScheduleData = useCallback(async () => {
    if (!userId) return;
    setIsLoadingSchedule(true);
    try {
      const upcoming = await monthScheduleService.getUpcomingClusters(2);
      setClusters(upcoming);

      const months = Array.from(new Set(upcoming.map((c) => c.poll_month)));
      const availabilityResults = await Promise.all(
        months.map((m) => refereeAvailabilityService.getRefereeAvailability(userId, m)),
      );
      const availMap = new Map<string, boolean>();
      availabilityResults.flat().forEach((a) => {
        if (a.poll_group_id) availMap.set(a.poll_group_id, a.is_available);
      });
      setMyAvailability(availMap);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Kon speelschema niet ophalen');
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [userId]);

  const fetchAssignments = useCallback(async () => {
    if (!userId) return;
    setIsLoadingAssignments(true);
    try {
      const data = await assignmentService.getAssignmentsForReferee(userId);
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.match_date || '').getTime();
        const dateB = new Date(b.match_date || '').getTime();
        return dateA - dateB;
      });
      setAssignments(sorted);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Kon toewijzingen niet ophalen');
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchScheduleData();
    fetchAssignments();
  }, [fetchScheduleData, fetchAssignments]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAssignments();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAssignments]);

  const submitAvailability = useCallback(
    async (clusterKey: string, pollMonth: string, isAvailable: boolean) => {
      if (!userId) return;

      setMyAvailability((prev) => new Map(prev).set(clusterKey, isAvailable));

      try {
        const success = await refereeAvailabilityService.updateAvailability(
          userId,
          null,
          clusterKey,
          pollMonth,
          isAvailable,
        );
        if (!success) {
          setMyAvailability((prev) => {
            const next = new Map(prev);
            next.delete(clusterKey);
            return next;
          });
          toast.error('Kon beschikbaarheid niet opslaan');
        }
      } catch (error) {
        console.error('Error updating availability:', error);
        toast.error('Kon beschikbaarheid niet opslaan');
      }
    },
    [userId],
  );

  const submitBulkAvailability = useCallback(
    async (pollMonth: string, availabilities: AvailabilityInput[]) => {
      if (!userId) return;
      setIsSubmitting(true);
      try {
        const result = await refereeAvailabilityService.submitAvailability(
          userId,
          pollMonth,
          availabilities,
        );
        if (result.success) {
          toast.success('Beschikbaarheid opgeslagen!');
          await fetchScheduleData();
        } else {
          toast.error(result.error || 'Kon beschikbaarheid niet opslaan');
        }
      } catch (error) {
        console.error('Error submitting availability:', error);
        toast.error('Kon beschikbaarheid niet opslaan');
      } finally {
        setIsSubmitting(false);
      }
    },
    [userId, fetchScheduleData],
  );

  const refreshData = useCallback(async () => {
    await Promise.all([fetchScheduleData(), fetchAssignments()]);
  }, [fetchScheduleData, fetchAssignments]);

  return {
    clusters,
    myAvailability,
    assignments,
    isLoadingSchedule,
    isLoadingAssignments,
    isSubmitting,
    userId,
    username,
    submitAvailability,
    submitBulkAvailability,
    refreshData,
  };
}
