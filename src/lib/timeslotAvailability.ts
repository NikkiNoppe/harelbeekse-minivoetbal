/** Kalenderdatum YYYY-MM-DD normaliseren. */
export function normalizeCalendarDate(date: string): string {
  return date.split('T')[0];
}

export type TimeslotDateRange = {
  valid_from?: string | null;
  valid_until?: string | null;
};

/** Leeg = heel seizoen; anders inclusief van/tot. */
export function isTimeslotValidOnDate(
  timeslot: TimeslotDateRange,
  date: string,
): boolean {
  const normalized = normalizeCalendarDate(date);
  const from = timeslot.valid_from ? normalizeCalendarDate(timeslot.valid_from) : null;
  const until = timeslot.valid_until ? normalizeCalendarDate(timeslot.valid_until) : null;

  if (!from && !until) return true;
  if (from && normalized < from) return false;
  if (until && normalized > until) return false;
  return true;
}

export function formatTimeslotPeriod(
  timeslot: TimeslotDateRange,
  locale = 'nl-BE',
): string {
  const from = timeslot.valid_from ? normalizeCalendarDate(timeslot.valid_from) : null;
  const until = timeslot.valid_until ? normalizeCalendarDate(timeslot.valid_until) : null;

  if (!from && !until) return 'Heel seizoen';

  const fmt = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  if (from && until) return `${fmt(from)} – ${fmt(until)}`;
  if (from) return `Vanaf ${fmt(from)}`;
  return `Tot ${fmt(until!)}`;
}

export function normalizeTimeslotDateRange(
  validFrom?: string | null,
  validUntil?: string | null,
): { valid_from?: string; valid_until?: string } {
  const from = validFrom?.trim() || undefined;
  const until = validUntil?.trim() || undefined;
  return {
    ...(from ? { valid_from: normalizeCalendarDate(from) } : {}),
    ...(until ? { valid_until: normalizeCalendarDate(until) } : {}),
  };
}
