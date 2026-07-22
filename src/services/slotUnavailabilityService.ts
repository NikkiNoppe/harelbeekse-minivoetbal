import { isTimeslotValidOnDate } from '@/lib/timeslotAvailability';
import type { SlotUnavailability } from '@/types/slotUnavailability';
import type { VenueTimeslotWithPriority } from '@/services/priorityOrderService';

export type SlotDetailRow = {
  venue: string;
  timeslot: VenueTimeslotWithPriority | null;
};

function addDaysToDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/** Kalenderdatum voor een priority-slot binnen een speelweek (maandag = weekstart). */
export function getCalendarDateForSlot(weekMonday: string, dayOfWeek: number): string {
  const base = weekMonday.split('T')[0];
  if (dayOfWeek === 1) return base;
  return addDaysToDate(base, 1);
}

export function isSlotUnavailabilityActive(
  blocks: SlotUnavailability[],
  date: string,
  venueId: number,
  timeslotId: number,
): boolean {
  const normalized = date.split('T')[0];
  return blocks.some(
    (b) =>
      b.is_active &&
      b.date.split('T')[0] === normalized &&
      b.venue_id === venueId &&
      b.timeslot_id === timeslotId,
  );
}

export function getBlockedSlotIndicesForWeek(
  weekMonday: string,
  slotDetails: SlotDetailRow[],
  blocks: SlotUnavailability[],
): Set<number> {
  const blocked = new Set<number>();
  slotDetails.forEach((row, index) => {
    const ts = row.timeslot;
    if (!ts) {
      blocked.add(index);
      return;
    }
    const matchDate = getCalendarDateForSlot(weekMonday, ts.day_of_week);
    if (!isTimeslotValidOnDate(ts, matchDate)) {
      blocked.add(index);
      return;
    }
    if (isSlotUnavailabilityActive(blocks, matchDate, ts.venue_id, ts.timeslot_id)) {
      blocked.add(index);
    }
  });
  return blocked;
}

export function getAvailableSlotIndicesForWeek(
  weekMonday: string,
  totalSlots: number,
  slotDetails: SlotDetailRow[],
  blocks: SlotUnavailability[],
): number[] {
  const blocked = getBlockedSlotIndicesForWeek(weekMonday, slotDetails, blocks);
  return Array.from({ length: totalSlots }, (_, i) => i).filter((i) => !blocked.has(i));
}

/** Max. wedstrijden in een week na aftrek van geblokkeerde slots. */
export function getEffectiveWeeklyMatchCapacity(
  weekMonday: string,
  totalSlots: number,
  slotDetails: SlotDetailRow[],
  blocks: SlotUnavailability[],
  configuredMax: number,
): number {
  const available = getAvailableSlotIndicesForWeek(
    weekMonday,
    totalSlots,
    slotDetails,
    blocks,
  ).length;
  return Math.min(configuredMax, available);
}

export function filterActiveSlotUnavailability(
  blocks: SlotUnavailability[] | undefined | null,
): SlotUnavailability[] {
  return (blocks ?? []).filter((b) => b.is_active);
}
