import { seasonService } from '@/services/seasonService';
import { priorityOrderService } from '@/services/priorityOrderService';
import {
  filterActiveSlotUnavailability,
  getAvailableSlotIndicesForWeek,
  getBlockedSlotIndicesForWeek,
  getEffectiveWeeklyMatchCapacity,
  type SlotDetailRow,
} from '@/services/slotUnavailabilityService';
import type { SlotUnavailability } from '@/types/slotUnavailability';

export interface SlotPlanningContext {
  blocks: SlotUnavailability[];
  slotDetails: SlotDetailRow[];
  totalSlots: number;
  getWeekCapacity: (weekMonday: string, configuredMax?: number) => number;
  getAvailableSlotIndices: (weekMonday: string) => number[];
  getBlockedSlotIndices: (weekMonday: string) => Set<number>;
  /** Volgend priority-slot na reeds gebruikte slots (sla geblokkeerde over). */
  getSlotIndexForUsage: (weekMonday: string, slotsUsed: number) => number | null;
}

export async function loadSlotPlanningContext(totalSlots = 7): Promise<SlotPlanningContext> {
  const seasonData = await seasonService.getSeasonData();
  const blocks = filterActiveSlotUnavailability(seasonData.slot_unavailability);

  const slotDetails: SlotDetailRow[] = [];
  for (let s = 0; s < totalSlots; s++) {
    const { venue, timeslot } = await priorityOrderService.getMatchDetails(s, totalSlots);
    slotDetails.push({ venue, timeslot });
  }

  return {
    blocks,
    slotDetails,
    totalSlots,
    getWeekCapacity: (weekMonday, configuredMax = totalSlots) =>
      getEffectiveWeeklyMatchCapacity(
        weekMonday,
        totalSlots,
        slotDetails,
        blocks,
        configuredMax,
      ),
    getAvailableSlotIndices: (weekMonday) =>
      getAvailableSlotIndicesForWeek(weekMonday, totalSlots, slotDetails, blocks),
    getBlockedSlotIndices: (weekMonday) =>
      getBlockedSlotIndicesForWeek(weekMonday, slotDetails, blocks),
    getSlotIndexForUsage: (weekMonday, slotsUsed) => {
      const available = getAvailableSlotIndicesForWeek(
        weekMonday,
        totalSlots,
        slotDetails,
        blocks,
      );
      if (slotsUsed >= available.length) return null;
      return available[slotsUsed];
    },
  };
}
